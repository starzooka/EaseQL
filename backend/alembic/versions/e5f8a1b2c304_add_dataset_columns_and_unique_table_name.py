"""store dataset columns and enforce unique table references

Revision ID: e5f8a1b2c304
Revises: d4e7f1a9c203
Create Date: 2026-09-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "e5f8a1b2c304"
down_revision: Union[str, Sequence[str], None] = "d4e7f1a9c203"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Persist extracted column metadata and prevent table collisions."""
    op.add_column(
        "datasets",
        sa.Column(
            "columns",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.create_unique_constraint("uq_datasets_table_name", "datasets", ["table_name"])


def downgrade() -> None:
    """Remove persisted column metadata and the table-name guard."""
    op.drop_constraint("uq_datasets_table_name", "datasets", type_="unique")
    op.drop_column("datasets", "columns")
