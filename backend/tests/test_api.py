import os
from datetime import date, datetime, timedelta
from secrets import token_urlsafe
from uuid import uuid4

import pytest
from argon2 import PasswordHasher
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError, TimeoutError
from sqlalchemy.orm import Session

from patterna import schemas
from patterna.auth import failed_attempts
from patterna.db import database
from patterna.import_details import CatalogueDetails, import_details
from patterna.import_study_plans import StudyPlans, import_study_plans
from patterna.main import app
from patterna.models import Base, Problem

PASSWORD = token_urlsafe(24)
BROWSER_HEADERS = {"X-Patterna-Request": "1"}
DRAFT = {
    "title": "Two copies",
    "language": "Kotlin",
    "approach": "",
    "timeComplexity": "O(n)",
    "spaceComplexity": "O(n)",
    "code": "",
    "thoughts": "**Preserve order**",
}


@pytest.fixture
def client(monkeypatch):
    url = os.environ.get("PATTERNA_TEST_DATABASE_URL")
    if not url:
        pytest.skip(
            "Set PATTERNA_TEST_DATABASE_URL to run PostgreSQL integration tests"
        )
    monkeypatch.setenv("PATTERNA_PASSWORD_HASH", PasswordHasher().hash(PASSWORD))
    monkeypatch.setenv("PATTERNA_SECURE_COOKIE", "true")
    failed_attempts.clear()

    schema = "test_" + uuid4().hex
    admin = create_engine(url)
    with admin.begin() as connection:
        connection.execute(text(f"CREATE SCHEMA {schema}"))
    engine = create_engine(url, connect_args={"options": f"-csearch_path={schema}"})
    try:
        Base.metadata.create_all(engine)
        with Session(engine) as db:
            db.add(
                Problem(
                    id=1,
                    title="Concatenation of Array",
                    difficulty="Easy",
                    category="Arrays & Hashing",
                    lc_slug="concatenation-of-array",
                    nc_slug="concatenation-of-array",
                    lists=["nc250"],
                    tags=[],
                )
            )
            db.commit()

        def override():
            with Session(engine) as db:
                yield db

        app.dependency_overrides[database] = override
        with TestClient(
            app, base_url="https://testserver", headers=BROWSER_HEADERS
        ) as browser:
            yield browser
    finally:
        app.dependency_overrides.pop(database, None)
        failed_attempts.clear()
        engine.dispose()
        with admin.begin() as connection:
            connection.execute(text(f"DROP SCHEMA {schema} CASCADE"))
        admin.dispose()


def login(client):
    response = client.post("/api/session", json={"password": PASSWORD})
    assert response.status_code == 204
    cookie = response.headers["set-cookie"].lower()
    assert all(flag in cookie for flag in ["httponly", "secure", "samesite=strict"])
    assert not response.content


@pytest.mark.parametrize(
    "failure",
    [OperationalError(None, None, ConnectionError()), TimeoutError()],
)
def test_database_unavailability_returns_a_retryable_response(monkeypatch, failure):
    def unavailable():
        raise failure

    monkeypatch.setitem(app.dependency_overrides, database, unavailable)
    with TestClient(app, raise_server_exceptions=False) as browser:
        for path in ("/api/health", "/api/workspace"):
            response = browser.get(path)
            assert response.status_code == 503
            assert response.json() == {
                "detail": "The database is temporarily unavailable. Try again."
            }
            assert response.headers["cache-control"] == "no-store"


def test_question_import_uses_stable_slug_and_prefers_neetcode(client):
    path = "/api/problems/1/question"
    assert client.get(path).status_code == 401
    login(client)
    assert client.get(path).json() is None
    assert client.get("/api/problems/2/question").status_code == 404

    catalogue = CatalogueDetails.model_validate(
        {
            "documentUrl": "https://docs.google.com/document/d/test",
            "documentRevision": "revision-1",
            "details": [
                {
                    "lcSlug": "concatenation-of-array",
                    "platform": platform,
                    "sourceUrl": source,
                    "verification": "verified",
                    "question": {
                        "description": [platform],
                        "examples": [{"input": "[1]", "output": "[1,1]"}],
                        "constraints": [bound],
                    },
                }
                for platform, source, bound in [
                    (
                        "neetcode",
                        "https://neetcode.io/problems/concatenation-of-array/question",
                        "1 <= nums.length <= 1000",
                    ),
                    (
                        "leetcode",
                        "https://leetcode.com/problems/concatenation-of-array/",
                        "1 <= n <= 1000",
                    ),
                ]
            ],
        }
    )
    sessions = app.dependency_overrides[database]()
    try:
        db = next(sessions)
        assert sum(import_details(db, catalogue, check_only=True).values()) == 2
        assert client.get(path).json() is None
        for _ in range(2):
            assert sum(import_details(db, catalogue, check_only=False).values()) == 2
        mismatched = catalogue.details[0].model_copy(
            update={"source_url": "https://neetcode.io/problems/two-sum/question"}
        )
        with pytest.raises(ValueError, match="Source link does not match"):
            import_details(
                db,
                catalogue.model_copy(update={"details": [mismatched]}),
                check_only=False,
            )
    finally:
        sessions.close()

    response = client.get(path)
    assert response.status_code == 200
    assert response.json()["description"] == ["neetcode"]
    assert response.json()["constraints"] == ["1 <= nums.length <= 1000"]
    assert client.get("/api/workspace").json()["problems"][0]["status"] == "Not started"


def test_study_plan_import_reuses_progress_and_is_idempotent(client):
    login(client)
    assert (
        client.patch("/api/problems/1/progress", json={"status": "Solved"}).status_code
        == 200
    )
    shared = {
        "lcSlug": "concatenation-of-array",
        "platformNumber": 1929,
        "title": "Shared title",
        "difficulty": "Easy",
        "category": "Shared topic",
        "tags": [],
        "sourceUrl": "https://leetcode.com/problems/concatenation-of-array/",
        "verification": "partial",
        "question": {
            "description": ["Existing task details"],
            "examples": [],
            "constraints": [],
        },
    }
    new = {
        **shared,
        "lcSlug": "new-study-plan-task",
        "platformNumber": 999999,
        "title": "New study plan task",
        "sourceUrl": "https://leetcode.com/problems/new-study-plan-task/",
        "verification": "verified",
        "question": {**shared["question"], "description": ["New task details"]},
    }
    plan = {
        "listId": "leetcode75",
        "documentUrl": "https://docs.google.com/document/d/study-plan",
        "documentRevision": "revision-1",
        "problems": [shared, new],
    }
    snapshot = StudyPlans.model_validate(
        {"plans": [plan, {**plan, "listId": "topinterview150", "problems": [new]}]}
    )
    sessions = app.dependency_overrides[database]()
    try:
        db = next(sessions)
        preview = import_study_plans(db, snapshot, check_only=True)
        assert preview["memberships_added"] == 3
        assert len(client.get("/api/workspace").json()["problems"]) == 1
        assert import_study_plans(db, snapshot, check_only=False) == preview
        repeat = import_study_plans(db, snapshot, check_only=False)
        assert (
            repeat["memberships_added"]
            == repeat["question_details_added_or_upgraded"]
            == 0
        )
        topic = {
            **plan,
            "listId": "ncall",
            "problems": [
                {
                    **new,
                    "platform": "neetcode",
                    "ncSlug": "new-neetcode-task",
                    "sourceUrl": "https://neetcode.io/problems/new-neetcode-task/question",
                    "verification": "partial",
                    "question": {
                        **new["question"],
                        "description": ["NeetCode version"],
                    },
                    "additionalLists": ["premiumalgo100"],
                }
            ],
        }
        second_topic = {
            **topic,
            "documentUrl": "https://docs.google.com/document/d/second-topic",
            "problems": [shared],
        }
        expanded = StudyPlans.model_validate({"plans": [topic, second_topic]})
        result = import_study_plans(db, expanded, check_only=False)
        assert result["plans"] == {"ncall": 2, "premiumalgo100": 1}
        assert result["neetcode_links_added"] == 1
        assert result["question_details_added_or_upgraded"] == 1
        assert result["list_categories_updated"] == 1
    finally:
        sessions.close()

    old, added = client.get("/api/workspace").json()["problems"]
    assert (old["id"], old["title"], old["status"], old["lists"]) == (
        1,
        "Concatenation of Array",
        "Solved",
        ["nc250", "leetcode75", "ncall"],
    )
    assert old["category"] == "Arrays & Hashing"
    assert old["listCategories"] == {"ncall": "Shared topic"}
    assert added["lists"] == [
        "leetcode75",
        "topinterview150",
        "ncall",
        "premiumalgo100",
    ]
    assert added["ncSlug"] == "new-neetcode-task"
    assert client.get(f"/api/problems/{added['id']}/question").json()[
        "description"
    ] == ["NeetCode version"]


def test_owner_session_and_browser_write_protection(client):
    assert client.get("/api/workspace").status_code == 401
    assert client.post("/api/session", json={"password": "wrong"}).status_code == 401
    assert (
        client.post(
            "/api/session",
            headers={"X-Patterna-Request": ""},
            json={"password": PASSWORD},
        ).status_code
        == 403
    )
    login(client)
    response = client.get("/api/workspace")
    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    assert response.json()["problems"][0]["status"] == "Not started"
    token = client.cookies.get("patterna_session")
    assert client.delete("/api/session").status_code == 204
    assert (
        client.get(
            "/api/workspace", headers={"Cookie": f"patterna_session={token}"}
        ).status_code
        == 401
    )


def test_invalid_password_hash_does_not_consume_login_attempt(client, monkeypatch):
    configured_hash = os.environ["PATTERNA_PASSWORD_HASH"]
    malformed_hash = configured_hash.rsplit("$", 1)[0] + "$!"
    with monkeypatch.context() as config:
        config.setenv("PATTERNA_PASSWORD_HASH", malformed_hash)
        response = client.post("/api/session", json={"password": PASSWORD})
        assert response.status_code == 503
        assert (
            response.json()["detail"]
            == "The configured password hash could not be verified"
        )
        assert not failed_attempts
    login(client)


def test_progress_and_practices_are_independent_and_retryable(client):
    login(client)
    progress = "/api/problems/1/progress"
    assert client.patch(progress, json={"status": "Solved"}).status_code == 200
    assert client.patch(progress, json={"needsReview": True}).json() == {
        "status": "Solved",
        "needsReview": True,
    }
    entry = {"id": str(uuid4()), "date": "2026-11-01"}
    path = f"/api/problems/1/practices/{entry['id']}"
    assert client.put(path, json=entry).status_code == 200
    assert client.put(path, json=entry).status_code == 200
    assert (
        client.put(path, json={**entry, "date": date.max.isoformat()}).status_code
        == 422
    )
    task = client.get("/api/workspace").json()["problems"][0]
    assert task["history"] == [entry]
    assert task["status"] == "Solved" and task["needsReview"]
    assert client.delete(path).status_code == 204
    assert client.get("/api/workspace").json()["problems"][0]["history"] == []


@pytest.mark.parametrize("invalid_date", [0, "86400", "2026-11-01T00:00:00Z"])
def test_practice_requires_an_iso_calendar_date(client, invalid_date):
    login(client)
    entry = {"id": str(uuid4()), "date": invalid_date}
    path = f"/api/problems/1/practices/{entry['id']}"
    assert client.put(path, json=entry).status_code == 422
    imported = {
        "id": str(uuid4()),
        "progress": [],
        "practices": [{**entry, "problemId": 1}],
        "solutions": [],
    }
    assert client.post("/api/browser-import", json=imported).status_code == 422
    assert client.get("/api/workspace").json()["problems"][0]["history"] == []


def test_saved_practice_remains_readable_after_clock_moves_back(client, monkeypatch):
    clock = datetime(2026, 11, 1, 0, 1)

    class PracticeClock(datetime):
        @classmethod
        def now(cls, tz=None):
            return clock.replace(tzinfo=tz)

    monkeypatch.setattr(schemas, "datetime", PracticeClock)
    login(client)
    entry = {"id": str(uuid4()), "date": "2026-11-01"}
    path = f"/api/problems/1/practices/{entry['id']}"
    assert client.put(path, json=entry).status_code == 200

    clock -= timedelta(minutes=2)
    workspace = client.get("/api/workspace")
    assert workspace.status_code == 200
    assert workspace.json()["problems"][0]["history"] == [entry]
    new_id = str(uuid4())
    assert (
        client.put(
            f"/api/problems/1/practices/{new_id}", json={**entry, "id": new_id}
        ).status_code
        == 422
    )


def test_solutions_check_versions_and_preserve_contents(client):
    login(client)
    path = f"/api/problems/1/solutions/{uuid4()}"
    assert (
        client.put(path, json={**DRAFT, "thoughts": "", "version": 0}).status_code
        == 422
    )
    created = client.put(path, json={**DRAFT, "version": 0}).json()
    assert created["version"] == 1
    assert client.put(path, json={**DRAFT, "version": 0}).json() == created
    unchanged = client.put(path, json={**DRAFT, "version": 1})
    assert unchanged.status_code == 200
    assert unchanged.json() == created
    edited = client.put(
        path, json={**DRAFT, "code": "return result", "version": 1}
    ).json()
    assert edited["version"] == 2
    assert edited["createdAt"] == created["createdAt"]
    retry = client.put(path, json={**DRAFT, "code": "return result", "version": 1})
    assert retry.status_code == 200
    assert retry.json() == edited
    assert client.put(path, json={**DRAFT, "version": 1}).status_code == 409
    assert client.delete(path, params={"version": 1}).status_code == 409
    state = client.get("/api/workspace").json()
    assert state["solutions"] == [edited]
    assert state["problems"][0]["history"] == []
    assert client.delete(path, params={"version": 2}).status_code == 204
    assert client.delete(path, params={"version": 2}).status_code == 204


@pytest.mark.parametrize("thoughts", ["1. \n2. ", "```python\n```", "```text\r\n  \r\n```"])
def test_solution_write_requires_visible_content(client, thoughts):
    login(client)
    path = f"/api/problems/1/solutions/{uuid4()}"
    response = client.put(path, json={**DRAFT, "thoughts": thoughts, "version": 0})
    assert response.status_code == 422

    visible_fence = "```\n---\n```"
    response = client.put(path, json={**DRAFT, "thoughts": visible_fence, "version": 0})
    assert response.status_code == 200
    assert response.json()["thoughts"] == visible_fence


def test_legacy_placeholder_solution_remains_readable_and_editable(client):
    login(client)
    solution = {
        **DRAFT,
        "thoughts": "1. ",
        "id": str(uuid4()),
        "problemId": 1,
        "createdAt": "2026-11-01T10:00:00Z",
        "updatedAt": "2026-11-01T10:00:00Z",
    }
    response = client.post(
        "/api/browser-import",
        json={"id": str(uuid4()), "progress": [], "practices": [], "solutions": [solution]},
    )
    assert response.status_code == 200
    assert client.get("/api/workspace").json()["solutions"][0]["thoughts"] == "1. "
    path = f"/api/problems/1/solutions/{solution['id']}"
    assert client.put(path, json={**DRAFT, "version": 1}).status_code == 200


def test_import_is_atomic_retryable_and_keeps_existing_progress(client):
    login(client)
    assert (
        client.patch("/api/problems/1/progress", json={"status": "Solved"}).status_code
        == 200
    )
    practice = {"id": str(uuid4()), "problemId": 1, "date": "2026-11-01"}
    solution = {
        **DRAFT,
        "id": str(uuid4()),
        "problemId": 1,
        "createdAt": "2026-11-01T10:00:00Z",
        "updatedAt": "2026-11-02T10:00:00Z",
    }
    payload = {
        "id": str(uuid4()),
        "progress": [{"problemId": 1, "status": "Unsolved"}],
        "practices": [practice],
        "solutions": [solution],
    }
    assert (
        client.post(
            "/api/browser-import",
            json={**payload, "solutions": [{**solution, "problemId": 2}]},
        ).status_code
        == 422
    )
    assert client.get("/api/workspace").json()["problems"][0]["history"] == []
    response = client.post("/api/browser-import", json=payload)
    assert response.status_code == 200
    assert response.json()["problems"][0]["status"] == "Solved"
    assert len(response.json()["solutions"]) == 1
    assert (
        client.delete(f"/api/problems/1/practices/{practice['id']}").status_code == 204
    )
    retry = client.post("/api/browser-import", json=payload)
    assert retry.json()["problems"][0]["history"] == []
    assert len(retry.json()["solutions"]) == 1


@pytest.mark.parametrize(
    ("section", "change"),
    [
        ("progress", {"status": "Unsolved"}),
        ("practices", {"date": "2026-11-02"}),
        ("solutions", {"thoughts": "A different solution"}),
    ],
)
def test_browser_import_rejects_conflicting_duplicates_atomically(
    client, section, change
):
    login(client)
    practice = {"id": str(uuid4()), "problemId": 1, "date": "2026-11-01"}
    payload = {
        "id": str(uuid4()),
        "progress": [{"problemId": 1, "status": "Solved"}],
        "practices": [practice],
        "solutions": [
            {
                **DRAFT,
                "id": str(uuid4()),
                "problemId": 1,
                "createdAt": "2026-11-01T10:00:00Z",
                "updatedAt": "2026-11-01T10:00:00Z",
            }
        ],
    }
    original = payload[section][0]
    bad_payload = {**payload, section: [original, {**original, **change}]}
    assert client.post("/api/browser-import", json=bad_payload).status_code == 422
    state = client.get("/api/workspace").json()
    assert state["problems"][0]["status"] == "Not started"
    assert state["problems"][0]["history"] == []
    assert state["solutions"] == []

    corrected = {**payload, section: [original, original]}
    response = client.post("/api/browser-import", json=corrected)
    assert response.status_code == 200
    state = response.json()
    assert state["problems"][0]["status"] == "Solved"
    assert state["problems"][0]["history"] == [
        {"id": practice["id"], "date": practice["date"]}
    ]
    assert len(state["solutions"]) == 1
