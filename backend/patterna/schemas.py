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
Difficulty = Literal["Easy", "Medium", "Hard", "Very Hard"]
StudyListId = Literal[
    "nc250",
    "nc150",
    "blind75",
    "ncall",
    "leetcode75",
    "top100liked",
    "topinterview150",
    "premiumalgo100",
    "leetcodefree",
]


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


class PracticeWrite(PracticeEntry):
    @field_validator("date", mode="before")
    @classmethod
    def require_calendar_date(cls, value):
        if not isinstance(value, date) and (
            not isinstance(value, str)
            or not re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}", value)
        ):
            raise ValueError("Use a calendar date in YYYY-MM-DD format")
        return value

    @field_validator("date")
    @classmethod
    def check_date(cls, value):
        if value > datetime.now(ZoneInfo("Europe/London")).date():
            raise ValueError("Practice date cannot be in the future")
        return value


class ProblemView(ProgressView):
    id: int
    title: str
    difficulty: Difficulty
    category: str
    list_categories: dict[StudyListId, str]
    lc_slug: str
    nc_slug: str
    lists: list[StudyListId]
    tags: list[str]
    history: list[PracticeEntry]


class ProblemExample(ApiModel):
    input: str
    output: str
    explanation: str | None = None
    label: str | None = None


class ProblemQuestion(ApiModel):
    description: list[str] = Field(min_length=1)
    examples: list[ProblemExample]
    constraints: list[str]
    requirements: list[str] = Field(default_factory=list)
    follow_ups: list[str] = Field(default_factory=list)
    hints: list[str] = Field(default_factory=list)


class SolutionDraft(ApiModel):
    title: str = Field(max_length=120)
    language: str = Field(max_length=40)
    approach: str = Field(max_length=200)
    time_complexity: str = Field(max_length=80)
    space_complexity: str = Field(max_length=80)
    code: str = Field(max_length=200_000)
    thoughts: str = Field(max_length=200_000)


class SolutionWrite(SolutionDraft):
    version: int = Field(ge=0)

    @model_validator(mode="after")
    def require_content(self):
        if self.code.strip():
            return self
        in_fence = False
        for line in re.split(r"\r\n?|\n", self.thoughts):
            if line.startswith("```"):
                in_fence = not in_fence
                continue
            content = (
                line.strip() if in_fence else re.sub(r"^[0-9]+\. |[#*`_\s-]", "", line)
            )
            if content:
                return self
        raise ValueError("Add code or thoughts before saving this solution")


class SolutionRecord(SolutionDraft):
    id: UUID
    problem_id: int
    created_at: AwareDatetime
    updated_at: AwareDatetime


class ImportedSolution(SolutionRecord):
    @model_validator(mode="after")
    def require_legacy_content(self):
        # Browser imports may contain placeholders saved by earlier releases.
        if not (self.code.strip() or re.sub(r"[#*`_\s-]", "", self.thoughts)):
            raise ValueError("Add code or thoughts before saving this solution")
        return self


class SolutionView(SolutionRecord):
    version: int


class ImportedProgress(ProgressPatch):
    problem_id: int


class ImportedPractice(PracticeWrite):
    problem_id: int


class ImportPayload(ApiModel):
    id: UUID
    progress: list[ImportedProgress] = Field(max_length=250)
    practices: list[ImportedPractice] = Field(max_length=10000)
    solutions: list[ImportedSolution] = Field(max_length=1000)


class Workspace(ApiModel):
    problems: list[ProblemView]
    solutions: list[SolutionView]
