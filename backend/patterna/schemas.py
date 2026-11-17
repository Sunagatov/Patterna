import re
from datetime import date, datetime
from typing import Literal
from uuid import UUID
from zoneinfo import ZoneInfo

from pydantic import (
    AwareDatetime,
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)
from pydantic.alias_generators import to_camel

Status = Literal["Not started", "In progress", "Unsolved", "Solved"]


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        extra="forbid",
    )

    @field_validator("*")
    @classmethod
    def reject_null_bytes(cls, value):
        if isinstance(value, str) and "\x00" in value:
            raise ValueError("Text cannot contain null bytes")
        return value


class ApiError(ApiModel):
    detail: str


class Login(ApiModel):
    password: str = Field(min_length=1, max_length=256)


class ProgressPatch(ApiModel):
    status: Status | None = None
    needs_review: bool | None = None

    @model_validator(mode="after")
    def require_change(self):
        if self.status is None and self.needs_review is None:
            raise ValueError("Supply a status or review flag")
        return self


class ProgressView(ApiModel):
    status: Status
    needs_review: bool


class PracticeEntry(ApiModel):
    id: UUID
    date: date

    @field_validator("date")
    @classmethod
    def check_date(cls, value):
        if value > datetime.now(ZoneInfo("Europe/London")).date():
            raise ValueError("Practice date cannot be in the future")
        return value


class ProblemView(ProgressView):
    id: int
    title: str
    difficulty: Literal["Easy", "Medium", "Hard", "Very Hard"]
    category: str
    lc_slug: str
    nc_slug: str
    lists: list[Literal["nc250", "nc150", "blind75"]]
    tags: list[str]
    history: list[PracticeEntry]


class SolutionDraft(ApiModel):
    title: str = Field(max_length=120)
    language: str = Field(max_length=40)
    approach: str = Field(max_length=200)
    time_complexity: str = Field(max_length=80)
    space_complexity: str = Field(max_length=80)
    code: str = Field(max_length=200_000)
    thoughts: str = Field(max_length=200_000)

    @model_validator(mode="after")
    def require_content(self):
        if not (self.code.strip() or re.sub(r"[#*`_\s-]", "", self.thoughts)):
            raise ValueError("Add code or thoughts before saving this solution")
        return self


class SolutionWrite(SolutionDraft):
    version: int = Field(ge=0)


class ImportedSolution(SolutionDraft):
    id: UUID
    problem_id: int
    created_at: AwareDatetime
    updated_at: AwareDatetime


class SolutionView(ImportedSolution):
    version: int


class ImportedProgress(ProgressPatch):
    problem_id: int


class ImportedPractice(PracticeEntry):
    problem_id: int


class ImportPayload(ApiModel):
    id: UUID
    progress: list[ImportedProgress] = Field(max_length=250)
    practices: list[ImportedPractice] = Field(max_length=10000)
    solutions: list[ImportedSolution] = Field(max_length=1000)


class Workspace(ApiModel):
    problems: list[ProblemView]
    solutions: list[SolutionView]
