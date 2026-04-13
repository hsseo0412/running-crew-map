"""create crews table

Revision ID: 0001
Revises:
Create Date: 2026-04-13 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "crews",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=1000), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("address", sa.String(length=300), nullable=True),
        sa.Column("meeting_day", sa.String(length=50), nullable=True),
        sa.Column("meeting_time", sa.String(length=10), nullable=True),
        sa.Column("pace", sa.String(length=20), nullable=True),
        sa.Column("level", sa.String(length=20), nullable=True),
        sa.Column("contact", sa.String(length=300), nullable=True),
        sa.Column("member_count", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_crews_id"), "crews", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_crews_id"), table_name="crews")
    op.drop_table("crews")
