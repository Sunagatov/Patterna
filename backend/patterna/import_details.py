import sys
from argparse import ArgumentParser, FileType
from collections import Counter
from typing import Literal
from urllib.parse import urlsplit

from pydantic import Field, ValidationError, model_validator
from sqlalchemy import case, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from .db import engine
from .models import Problem, ProblemDetail
from .schemas import ApiModel, ProblemQuestion

VERIFICATION_RANK = {"blocked": 0, "partial": 1, "verified": 2}


class SourceDetail(ApiModel):
    lc_slug: str
    platform: Literal["neetcode", "leetcode"]
    platform_number: int | None = Field(default=None, gt=0)
    source_url: str
    verification: Literal["verified", "partial", "blocked"]
    question: ProblemQuestion | None
    source_notes: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def check_question(self):
        if (self.verification == "blocked") != (self.question is None):
            raise ValueError("Only a blocked source may omit its question")
        return self


class CatalogueDetails(ApiModel):
    document_url: str
    document_revision: str = Field(min_length=1)
    details: list[SourceDetail] = Field(min_length=1)


def validate_document_url(url: str):
    document = urlsplit(url)
    if (
        document.scheme != "https"
        or document.netloc != "docs.google.com"
        or not document.path.startswith("/document/d/")
    ):
        raise ValueError("Expected a native Google Docs source URL")


def validate_problem_source(detail: SourceDetail, nc_slug: str):
    source = urlsplit(detail.source_url)
    host, path = (
        ("neetcode.io", f"/problems/{nc_slug}/question")
        if detail.platform == "neetcode"
        else ("leetcode.com", f"/problems/{detail.lc_slug}")
    )
    if (
        source.scheme != "https"
        or source.netloc != host
        or source.path.rstrip("/") != path
    ):
        raise ValueError(f"Source link does not match the catalogue: {detail.lc_slug}")


def import_details(db: Session, catalogue: CatalogueDetails, *, check_only: bool):
    validate_document_url(catalogue.document_url)
    problems = {problem.lc_slug: problem for problem in db.scalars(select(Problem))}
    rows = []
    seen = set()
    for detail in catalogue.details:
        key = (detail.lc_slug, detail.platform)
        if key in seen or detail.lc_slug not in problems:
            raise ValueError(f"Duplicate or unknown catalogue identity: {key}")
        seen.add(key)
        problem = problems[detail.lc_slug]
        validate_problem_source(detail, problem.nc_slug)
        rows.append(
            {
                "problem_id": problem.id,
                "document_url": catalogue.document_url,
                "document_revision": catalogue.document_revision,
                **detail.model_dump(exclude={"lc_slug"}, mode="json"),
            }
        )

    if check_only:
        return Counter(
            (detail.platform, detail.verification) for detail in catalogue.details
        )

    statement = insert(ProblemDetail)
    incoming_rank = case(VERIFICATION_RANK, value=statement.excluded.verification)
    existing_rank = case(VERIFICATION_RANK, value=ProblemDetail.verification)
    write = statement.on_conflict_do_update(
        index_elements=[ProblemDetail.problem_id, ProblemDetail.platform],
        set_={
            key: statement.excluded[key]
            for key in rows[0]
            if key not in {"problem_id", "platform"}
        },
        where=incoming_rank >= existing_rank,
    ).returning(ProblemDetail.platform, ProblemDetail.verification)
    counts = Counter(
        (platform, verification)
        for platform, verification in db.execute(write, rows)
    )
    db.commit()
    return counts


def main():
    parser = ArgumentParser(
        description="Import structured Google Docs catalogue details"
    )
    parser.add_argument("source", type=FileType("rb"), help="JSON file or - for stdin")
    parser.add_argument("--check", action="store_true", help="Validate without writing")
    args = parser.parse_args()
    try:
        catalogue = CatalogueDetails.model_validate_json(args.source.read())
        with Session(engine()) as db:
            counts = import_details(db, catalogue, check_only=args.check)
    except ValidationError as error:
        for issue in error.errors(include_input=False):
            print(f"{issue['loc']}: {issue['msg']}", file=sys.stderr)
        raise SystemExit(1) from None
    except ValueError as error:
        raise SystemExit(str(error)) from None
    action = "Validated" if args.check else "Imported"
    for (platform, status), count in sorted(counts.items()):
        print(f"{action} {count} {platform} records ({status}).")
    skipped = len(catalogue.details) - counts.total()
    if skipped:
        print(f"Kept {skipped} existing source records with higher verification.")


if __name__ == "__main__":
    main()
