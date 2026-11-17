import os
from datetime import date
from uuid import uuid4

import pytest
from argon2 import PasswordHasher
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from patterna.auth import failed_attempts
from patterna.db import database
from patterna.import_details import CatalogueDetails, import_details
from patterna.main import app
from patterna.models import Base, Problem

PASSWORD = "patterna-integration-test-password"
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
    edited = client.put(
        path, json={**DRAFT, "code": "return result", "version": 1}
    ).json()
    assert edited["version"] == 2
    assert edited["createdAt"] == created["createdAt"]
    assert client.put(path, json={**DRAFT, "version": 1}).status_code == 409
    assert client.delete(path, params={"version": 1}).status_code == 409
    state = client.get("/api/workspace").json()
    assert state["solutions"] == [edited]
    assert state["problems"][0]["history"] == []
    assert client.delete(path, params={"version": 2}).status_code == 204


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
