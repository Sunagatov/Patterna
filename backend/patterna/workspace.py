from collections import defaultdict
from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, select, update
from sqlalchemy.dialects.postgresql import insert

from .auth import DB, require_owner
from .models import BrowserImport, Practice, Problem, ProblemDetail, Progress, Solution
from .schemas import (
    ImportPayload,
    PracticeEntry,
    ProblemQuestion,
    ProblemView,
    ProgressPatch,
    ProgressView,
    SolutionView,
    SolutionWrite,
    Workspace,
)

router = APIRouter(
    prefix="/api", dependencies=[Depends(require_owner)], tags=["workspace"]
)


def snapshot(db: DB) -> Workspace:
    rows = db.execute(
        select(Problem, Progress).outerjoin(Progress).order_by(Problem.id)
    )
    practices = defaultdict(list)
    for practice in db.scalars(select(Practice).order_by(Practice.date, Practice.id)):
        practices[practice.problem_id].append(PracticeEntry.model_validate(practice))
    problems = [
        ProblemView(
            id=problem.id,
            title=problem.title,
            difficulty=problem.difficulty,
            category=problem.category,
            lc_slug=problem.lc_slug,
            nc_slug=problem.nc_slug,
            lists=problem.lists,
            tags=problem.tags,
            status=progress.status if progress else "Not started",
            needs_review=progress.needs_review if progress else False,
            history=practices[problem.id],
        )
        for problem, progress in rows
    ]
    solutions = [
        SolutionView.model_validate(solution)
        for solution in db.scalars(
            select(Solution).order_by(Solution.created_at, Solution.id)
        )
    ]
    return Workspace(problems=problems, solutions=solutions)


@router.get("/workspace")
def get_workspace(db: DB) -> Workspace:
    return snapshot(db)


def require_problem(db: DB, problem_id: int):
    if db.get(Problem, problem_id) is None:
        raise HTTPException(404, "Problem not found")


@router.get("/problems/{problem_id}/question")
def get_question(problem_id: int, db: DB) -> ProblemQuestion | None:
    require_problem(db, problem_id)
    for platform in ("neetcode", "leetcode"):
        details = db.get(ProblemDetail, (problem_id, platform))
        if details and details.question is not None:
            return ProblemQuestion.model_validate(details.question)
    return None


@router.patch("/problems/{problem_id}/progress")
def change_progress(problem_id: int, body: ProgressPatch, db: DB) -> ProgressView:
    require_problem(db, problem_id)
    values = body.model_dump(exclude_none=True)
    row = db.scalars(
        insert(Progress)
        .values(problem_id=problem_id, **values)
        .on_conflict_do_update(index_elements=[Progress.problem_id], set_=values)
        .returning(Progress)
    ).one()
    result = ProgressView.model_validate(row)
    db.commit()
    return result


@router.put("/problems/{problem_id}/practices/{practice_id}")
def log_practice(
    problem_id: int, practice_id: UUID, body: PracticeEntry, db: DB
) -> PracticeEntry:
    require_problem(db, problem_id)
    if practice_id != body.id:
        raise HTTPException(422, "Practice ID must match its URL")
    db.execute(
        insert(Practice)
        .values(problem_id=problem_id, **body.model_dump())
        .on_conflict_do_nothing()
    )
    entry = db.get(Practice, practice_id)
    if entry is None or entry.problem_id != problem_id or entry.date != body.date:
        raise HTTPException(409, "That practice ID already belongs to another entry")
    db.commit()
    return body


@router.delete("/problems/{problem_id}/practices/{practice_id}", status_code=204)
def delete_practice(problem_id: int, practice_id: UUID, db: DB):
    require_problem(db, problem_id)
    db.execute(
        delete(Practice).where(
            Practice.problem_id == problem_id, Practice.id == practice_id
        )
    )
    db.commit()


@router.put("/problems/{problem_id}/solutions/{solution_id}")
def save_solution(
    problem_id: int, solution_id: UUID, body: SolutionWrite, db: DB
) -> SolutionView:
    require_problem(db, problem_id)
    now = datetime.now(UTC)
    content = body.model_dump(exclude={"version"})
    if body.version == 0:
        statement = (
            insert(Solution)
            .values(
                id=solution_id,
                problem_id=problem_id,
                created_at=now,
                updated_at=now,
                **content,
            )
            .on_conflict_do_nothing()
        )
    else:
        statement = (
            update(Solution)
            .where(
                Solution.id == solution_id,
                Solution.problem_id == problem_id,
                Solution.version == body.version,
            )
            .values(updated_at=now, version=Solution.version + 1, **content)
        )
    row = db.scalars(statement.returning(Solution)).one_or_none()
    if row is None and body.version == 0:
        existing = db.get(Solution, solution_id)
        if (
            existing is not None
            and existing.problem_id == problem_id
            and existing.version == 1
            and all(getattr(existing, key) == value for key, value in content.items())
        ):
            row = existing
    if row is None:
        raise HTTPException(
            409,
            "This solution changed elsewhere. Copy your draft and reload before saving.",
        )
    result = SolutionView.model_validate(row)
    db.commit()
    return result


@router.delete("/problems/{problem_id}/solutions/{solution_id}", status_code=204)
def delete_solution(
    problem_id: int, solution_id: UUID, version: Annotated[int, Query(ge=1)], db: DB
):
    require_problem(db, problem_id)
    result = db.execute(
        delete(Solution).where(
            Solution.problem_id == problem_id,
            Solution.id == solution_id,
            Solution.version == version,
        )
    )
    if result.rowcount != 1:
        raise HTTPException(
            409, "This solution changed elsewhere. Reload before deleting."
        )
    db.commit()


@router.post("/browser-import")
def import_browser_data(body: ImportPayload, db: DB) -> Workspace:
    claimed = db.scalar(
        insert(BrowserImport)
        .values(id=body.id)
        .on_conflict_do_nothing()
        .returning(BrowserImport.id)
    )
    if claimed is None:
        return snapshot(db)

    problem_ids = set(db.scalars(select(Problem.id)))
    if any(
        item.problem_id not in problem_ids
        for item in (*body.progress, *body.practices, *body.solutions)
    ):
        raise HTTPException(
            422, "The import references a problem outside the current catalogue"
        )
    for model, entries in [
        (Progress, body.progress),
        (Practice, body.practices),
        (Solution, body.solutions),
    ]:
        if entries:
            statement = insert(model).on_conflict_do_nothing()
            # Optional progress fields can be absent independently.
            for entry in entries:
                db.execute(statement.values(**entry.model_dump(exclude_none=True)))
    db.commit()
    return snapshot(db)
