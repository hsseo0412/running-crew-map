"""add routes table

Revision ID: 0003
Revises: 0002
Create Date: 2026-04-16
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "routes",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "crew_id",
            sa.Integer(),
            sa.ForeignKey("crews.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("coordinates", JSON, nullable=False),
        sa.Column("distance_km", sa.Float(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("routes")
