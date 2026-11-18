import json
import sys
from argparse import ArgumentParser, FileType
from collections import Counter, defaultdict
from typing import Literal

from pydantic import Field, ValidationError
from sqlalchemy import select, text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from .db import engine
from .import_details import SourceDetail, validate_document_url, validate_problem_source
from .models import Problem, ProblemDetail
from .schemas import ApiModel, Difficulty

VERIFICATION_RANK = {"blocked": 0, "partial": 1, "verified": 2}


class StudyPlanProblem(SourceDetail):
    lc_slug: str = Field(max_length=160, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    platform: Literal["leetcode"] = "leetcode"
    platform_number: int = Field(gt=0)
    title: str = Field(min_length=1, max_length=200)
    difficulty: Difficulty
    category: str = Field(min_length=1, max_length=80)
    tags: list[str]


class StudyPlan(ApiModel):
    list_id: Literal["leetcode75", "top100liked", "topinterview150"]
    document_url: str
    document_revision: str = Field(min_length=1)
    problems: list[StudyPlanProblem] = Field(min_length=1)


class StudyPlans(ApiModel):
    plans: list[StudyPlan] = Field(min_length=1)


def import_study_plans(db: Session, snapshot: StudyPlans, *, check_only: bool):
    memberships = defaultdict(list)
    selected = {}
    numbers = {}
    seen_plans = set()
    for plan in snapshot.plans:
        validate_document_url(plan.document_url)
        if plan.list_id in seen_plans:
            raise ValueError(f"Duplicate study plan: {plan.list_id}")
        seen_plans.add(plan.list_id)
        for record in plan.problems:
            validate_problem_source(record, "")
            slug = record.lc_slug
            if plan.list_id in memberships[slug]:
                raise ValueError(f"Duplicate problem in {plan.list_id}: {slug}")
            memberships[slug].append(plan.list_id)
            if numbers.setdefault(record.platform_number, slug) != slug:
                raise ValueError(
                    f"Conflicting slugs for LeetCode #{record.platform_number}"
                )
            if slug in selected:
                previous = selected[slug][1]
                if (previous.platform_number, previous.difficulty) != (
                    record.platform_number,
                    record.difficulty,
                ):
                    raise ValueError(f"Conflicting catalogue identity: {slug}")
                if (
                    VERIFICATION_RANK[record.verification]
                    <= VERIFICATION_RANK[previous.verification]
                ):
                    continue
            selected[slug] = (plan, record)

    if not check_only:
        # Protect allocated IDs and membership/detail merges from parallel imports.
        db.execute(
            text("LOCK TABLE problems, problem_details IN SHARE ROW EXCLUSIVE MODE")
        )
    problems = {problem.lc_slug: problem for problem in db.scalars(select(Problem))}
    existing_details = {
        detail.problem_id: detail
        for detail in db.scalars(
            select(ProblemDetail).where(ProblemDetail.platform == "leetcode")
        )
    }
    next_id = max((problem.id for problem in problems.values()), default=0) + 1
    details = []
    counts = Counter()

    for slug, (plan, record) in selected.items():
        problem = problems.get(slug)
        added = [
            member
            for member in memberships[slug]
            if problem is None or member not in problem.lists
        ]
        counts["memberships_added"] += len(added)
        if problem is None:
            counts["problems_added"] += 1
            problem = Problem(
                id=next_id,
                title=record.title,
                difficulty=record.difficulty,
                category=record.category,
                lc_slug=slug,
                nc_slug="",
                lists=added,
                tags=record.tags,
            )
            next_id += 1
            if not check_only:
                db.add(problem)
        elif added and not check_only:
            problem.lists = [*problem.lists, *added]

        existing = existing_details.get(problem.id)
        if (
            existing is not None
            and VERIFICATION_RANK[existing.verification]
            >= VERIFICATION_RANK[record.verification]
        ):
            continue
        details.append(
            {
                "problem_id": problem.id,
                "document_url": plan.document_url,
                "document_revision": plan.document_revision,
                **record.model_dump(
                    exclude={"lc_slug", "title", "difficulty", "category", "tags"},
                    mode="json",
                ),
            }
        )

    if not check_only:
        db.flush()
        if details:
            statement = insert(ProblemDetail)
            db.execute(
                statement.on_conflict_do_update(
                    index_elements=[ProblemDetail.problem_id, ProblemDetail.platform],
                    set_={
                        key: statement.excluded[key]
                        for key in details[0]
                        if key not in {"problem_id", "platform"}
                    },
                ),
                details,
            )
        db.commit()

    return {
        "plans": {plan.list_id: len(plan.problems) for plan in snapshot.plans},
        "unique_problems_in_plans": len(selected),
        "problems_added": counts["problems_added"],
        "memberships_added": counts["memberships_added"],
        "question_details_added_or_upgraded": len(details),
        "resulting_catalogue_size": len(problems) + counts["problems_added"],
    }


def main():
    parser = ArgumentParser(
        description="Merge private Google Docs study plans into Patterna"
    )
    parser.add_argument("source", type=FileType("rb"), help="JSON file or - for stdin")
    parser.add_argument("--check", action="store_true", help="Preview without writing")
    args = parser.parse_args()
    try:
        snapshot = StudyPlans.model_validate_json(args.source.read())
        with Session(engine()) as db:
            counts = import_study_plans(db, snapshot, check_only=args.check)
    except ValidationError as error:
        for issue in error.errors(include_input=False):
            print(f"{issue['loc']}: {issue['msg']}", file=sys.stderr)
        raise SystemExit(1) from None
    except ValueError as error:
        raise SystemExit(str(error)) from None
    print(json.dumps(counts))


if __name__ == "__main__":
    main()
