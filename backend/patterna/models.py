from datetime import date, datetime
from uuid import UUID

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    String,
    Text,
    Uuid,
    false,
    text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Problem(Base):
    __tablename__ = "problems"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)
    title: Mapped[str] = mapped_column(String(200))
    difficulty: Mapped[str] = mapped_column(String(12))
    category: Mapped[str] = mapped_column(String(80))
    lc_slug: Mapped[str] = mapped_column(String(160), unique=True)
    nc_slug: Mapped[str] = mapped_column(String(160))
    lists: Mapped[list[str]] = mapped_column(JSON)
    tags: Mapped[list[str]] = mapped_column(JSON)


class Progress(Base):
    __tablename__ = "progress"
    __table_args__ = (
        CheckConstraint(
            "status IN ('Not started', 'In progress', 'Unsolved', 'Solved')",
            name="progress_status_valid",
        ),
    )
    problem_id: Mapped[int] = mapped_column(ForeignKey("problems.id"), primary_key=True)
    status: Mapped[str] = mapped_column(String(12), server_default="Not started")
    needs_review: Mapped[bool] = mapped_column(Boolean, server_default=false())


class Practice(Base):
    __tablename__ = "practices"
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True)
    problem_id: Mapped[int] = mapped_column(ForeignKey("problems.id"), index=True)
    date: Mapped[date]


class Solution(Base):
    __tablename__ = "solutions"
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True)
    problem_id: Mapped[int] = mapped_column(ForeignKey("problems.id"), index=True)
    title: Mapped[str] = mapped_column(String(120))
    language: Mapped[str] = mapped_column(String(40))
    approach: Mapped[str] = mapped_column(String(200))
    time_complexity: Mapped[str] = mapped_column(String(80))
    space_complexity: Mapped[str] = mapped_column(String(80))
    code: Mapped[str] = mapped_column(Text)
    thoughts: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    version: Mapped[int] = mapped_column(server_default=text("1"))


class OwnerSession(Base):
    __tablename__ = "owner_sessions"
    digest: Mapped[str] = mapped_column(String(64), primary_key=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)


class BrowserImport(Base):
    __tablename__ = "browser_imports"
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True)
