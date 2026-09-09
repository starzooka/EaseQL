"""add dataset to chat sessions

Revision ID: d4e7f1a9c203
Revises: c9f2a6b8d315
Create Date: 2026-09-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d4e7f1a9c203"
down_revision: Union[str, Sequence[str], None] = "c9f2a6b8d315"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Associate chat sessions with datasets without changing existing rows."""
    op.add_column(
        "chat_sessions",
        sa.Column("dataset_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_chat_sessions_dataset_id_datasets",
        "chat_sessions",
        "datasets",
        ["dataset_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index(op.f("ix_chat_sessions_dataset_id"), "chat_sessions", ["dataset_id"], unique=False)


def downgrade() -> None:
    """Remove the chat session dataset association."""
    op.drop_index(op.f("ix_chat_sessions_dataset_id"), table_name="chat_sessions")
    op.drop_constraint("fk_chat_sessions_dataset_id_datasets", "chat_sessions", type_="foreignkey")
    op.drop_column("chat_sessions", "dataset_id")