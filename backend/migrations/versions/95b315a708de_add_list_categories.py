"""Preserve source-specific problem topics.

Revision ID: 95b315a708de
Revises: 7f4d951a203b
"""

import sqlalchemy as sa
from alembic import op

revision = "95b315a708de"
down_revision = "7f4d951a203b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "problems",
        sa.Column(
            "list_categories", sa.JSON(), nullable=False, server_default=sa.text("'{}'")
        ),
    )


def downgrade() -> None:
    op.drop_column("problems", "list_categories")
