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
SLUG_PATTERN = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"


class StudyPlanProblem(SourceDetail):
    lc_slug: str = Field(max_length=160, pattern=SLUG_PATTERN)
    nc_slug: str = Field(
        default="", max_length=160, pattern=r"^(?:[a-z0-9]+(?:-[a-z0-9]+)*)?$"
    )
    platform: Literal["neetcode", "leetcode"] = "leetcode"
    platform_number: int = Field(gt=0)
    title: str = Field(min_length=1, max_length=200)
    difficulty: Difficulty
    category: str = Field(min_length=1, max_length=80)
    tags: list[str]
    additional_lists: list[Literal["premiumalgo100"]] = Field(default_factory=list)


class StudyPlan(ApiModel):
    list_id: Literal[
        "leetcode75", "top100liked", "topinterview150", "ncall", "leetcodefree"
    ]
    document_url: str
    document_revision: str = Field(min_length=1)
    problems: list[StudyPlanProblem] = Field(min_length=1)


class StudyPlans(ApiModel):
    plans: list[StudyPlan] = Field(min_length=1)


def import_study_plans(db: Session, snapshot: StudyPlans, *, check_only: bool):
    memberships = defaultdict(list)
    list_categories = defaultdict(dict)
    selected = {}
    catalogue = {}
    numbers = {}
    neetcode_slugs = {}
    plan_counts = Counter()
    seen_plans = set()
    for plan in snapshot.plans:
        validate_document_url(plan.document_url)
        plan_key = (plan.list_id, plan.document_url)
        if plan_key in seen_plans:
            raise ValueError(f"Duplicate study plan document: {plan.list_id}")
        seen_plans.add(plan_key)
        for record in plan.problems:
            slug = record.lc_slug
            if record.platform == "neetcode" and not record.nc_slug:
                raise ValueError(f"Missing NeetCode slug: {slug}")
            validate_problem_source(record, record.nc_slug)
            for list_id in (plan.list_id, *record.additional_lists):
                if list_id in memberships[slug]:
                    raise ValueError(f"Duplicate problem in {list_id}: {slug}")
                memberships[slug].append(list_id)
                plan_counts[list_id] += 1
            if plan.list_id == "ncall" or (
                plan.list_id == "leetcodefree" and record.category != "Uncategorized"
            ):
                list_categories[slug][plan.list_id] = record.category
            if numbers.setdefault(record.platform_number, slug) != slug:
                raise ValueError(
                    f"Conflicting slugs for LeetCode #{record.platform_number}"
                )
            first = catalogue.setdefault(slug, record)
            if (first.platform_number, first.difficulty) != (
                record.platform_number,
                record.difficulty,
            ):
                raise ValueError(f"Conflicting catalogue identity: {slug}")
            if record.nc_slug and (
                neetcode_slugs.setdefault(slug, record.nc_slug) != record.nc_slug
            ):
                raise ValueError(f"Conflicting NeetCode slugs: {slug}")
            key = (slug, record.platform)
            if key not in selected or (
                VERIFICATION_RANK[record.verification]
                > VERIFICATION_RANK[selected[key][1].verification]
            ):
                selected[key] = (plan, record)

    if not check_only:
        # Protect allocated IDs and membership/detail merges from parallel imports.
        db.execute(
            text("LOCK TABLE problems, problem_details IN SHARE ROW EXCLUSIVE MODE")
        )
    problems = {problem.lc_slug: problem for problem in db.scalars(select(Problem))}
    existing_details = {
        (detail.problem_id, detail.platform): detail
        for detail in db.scalars(select(ProblemDetail))
    }
    current_neetcode = {
        problem.nc_slug: slug for slug, problem in problems.items() if problem.nc_slug
    }
    next_id = max((problem.id for problem in problems.values()), default=0) + 1
    details = []
    counts = Counter()

    imported_ids = {}
    for slug, record in catalogue.items():
        problem = problems.get(slug)
        nc_slug = neetcode_slugs.get(slug, "")
        if nc_slug and (
            current_neetcode.setdefault(nc_slug, slug) != slug
            or (problem and problem.nc_slug and problem.nc_slug != nc_slug)
        ):
            raise ValueError(f"NeetCode slug conflicts with the catalogue: {slug}")
        added = [
            member
            for member in memberships[slug]
            if problem is None or member not in problem.lists
        ]
        counts["memberships_added"] += len(added)
        category = problem.category if problem is not None else record.category
        categories = {
            list_id: topic
            for list_id, topic in list_categories[slug].items()
            if topic != category
        }
        if problem is None:
            counts["problems_added"] += 1
            problem = Problem(
                id=next_id,
                title=record.title,
                difficulty=record.difficulty,
                category=record.category,
                list_categories=categories,
                lc_slug=slug,
                nc_slug=nc_slug,
                lists=added,
                tags=record.tags,
            )
            next_id += 1
            if not check_only:
                db.add(problem)
        else:
            if added and not check_only:
                problem.lists = [*problem.lists, *added]
            if nc_slug and not problem.nc_slug:
                counts["neetcode_links_added"] += 1
                if not check_only:
                    problem.nc_slug = nc_slug
            merged_categories = {
                list_id: topic
                for list_id, topic in (
                    problem.list_categories | list_categories[slug]
                ).items()
                if topic != category
            }
            if merged_categories != problem.list_categories:
                counts["list_categories_updated"] += 1
                if not check_only:
                    problem.list_categories = merged_categories
        imported_ids[slug] = problem.id

    for (slug, platform), (plan, record) in selected.items():
        problem_id = imported_ids[slug]
        existing = existing_details.get((problem_id, platform))
        if (
            existing is not None
            and existing.platform_number is not None
            and existing.platform_number != record.platform_number
        ):
            raise ValueError(f"LeetCode number conflicts with the catalogue: {slug}")
        if (
            existing is not None
            and VERIFICATION_RANK[existing.verification]
            >= VERIFICATION_RANK[record.verification]
        ):
            continue
        counts["question_details_added_or_upgraded"] += record.question is not None
        details.append(
            {
                "problem_id": problem_id,
                "document_url": plan.document_url,
                "document_revision": plan.document_revision,
                **record.model_dump(
                    exclude={
                        "lc_slug",
                        "nc_slug",
                        "title",
                        "difficulty",
                        "category",
                        "tags",
                        "additional_lists",
                    },
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
        "plans": dict(plan_counts),
        "unique_problems_in_plans": len(catalogue),
        "problems_added": counts["problems_added"],
        "memberships_added": counts["memberships_added"],
        "neetcode_links_added": counts["neetcode_links_added"],
        "list_categories_updated": counts["list_categories_updated"],
        "question_details_added_or_upgraded": counts[
            "question_details_added_or_upgraded"
        ],
        "metadata_only_sources_added": len(details)
        - counts["question_details_added_or_upgraded"],
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
