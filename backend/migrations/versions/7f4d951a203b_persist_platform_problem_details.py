"""persist platform problem details

Revision ID: 7f4d951a203b
Revises: 8faa8d796919
Create Date: 2026-11-17 21:04:11.852069

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "7f4d951a203b"
down_revision: str | Sequence[str] | None = "8faa8d796919"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "problem_details",
        sa.Column("problem_id", sa.Integer(), nullable=False),
        sa.Column("platform", sa.String(length=8), nullable=False),
        sa.Column("platform_number", sa.Integer(), nullable=True),
        sa.Column("source_url", sa.Text(), nullable=False),
        sa.Column("document_url", sa.Text(), nullable=False),
        sa.Column("document_revision", sa.Text(), nullable=False),
        sa.Column("verification", sa.String(length=8), nullable=False),
        sa.Column("question", sa.JSON(none_as_null=True), nullable=True),
        sa.Column("source_notes", sa.JSON(), nullable=False),
        sa.CheckConstraint(
            "platform IN ('neetcode', 'leetcode')", name="problem_detail_platform_valid"
        ),
        sa.CheckConstraint(
            "verification IN ('verified', 'partial', 'blocked')",
            name="problem_detail_verification_valid",
        ),
        sa.CheckConstraint(
            "(verification = 'blocked') = (question IS NULL)",
            name="problem_detail_question_availability",
        ),
        sa.ForeignKeyConstraint(
            ["problem_id"],
            ["problems.id"],
        ),
        sa.PrimaryKeyConstraint("problem_id", "platform"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("problem_details")
