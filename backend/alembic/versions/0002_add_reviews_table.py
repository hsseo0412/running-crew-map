"""add reviews table

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-15
"""

from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "reviews",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "crew_id",
            sa.Integer(),
            sa.ForeignKey("crews.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("nickname", sa.String(50), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("rating", sa.SmallInteger(), nullable=False),
        sa.CheckConstraint("rating BETWEEN 1 AND 5", name="ck_reviews_rating"),
        sa.Column("content", sa.String(500), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("reviews")
