"""add query execution history fields

Revision ID: b7e1f3a9c204
Revises: a8c4d2e6f901
Create Date: 2026-09-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "b7e1f3a9c204"
down_revision: Union[str, Sequence[str], None] = "a8c4d2e6f901"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add persisted query execution results and metadata."""
    op.add_column(
        "chat_history",
        sa.Column("session_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "chat_history",
        sa.Column("result_data", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column("chat_history", sa.Column("row_count", sa.Integer(), nullable=True))
    op.add_column("chat_history", sa.Column("execution_status", sa.String(length=32), nullable=True))
    op.add_column("chat_history", sa.Column("execution_time_ms", sa.Integer(), nullable=True))
    op.add_column("chat_history", sa.Column("error_message", sa.Text(), nullable=True))
    op.create_foreign_key(
        "fk_chat_history_session_id_chat_sessions",
        "chat_history",
        "chat_sessions",
        ["session_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(op.f("ix_chat_history_session_id"), "chat_history", ["session_id"], unique=False)


def downgrade() -> None:
    """Remove persisted query execution results and metadata."""
    op.drop_index(op.f("ix_chat_history_session_id"), table_name="chat_history")
    op.drop_constraint("fk_chat_history_session_id_chat_sessions", "chat_history", type_="foreignkey")
    op.drop_column("chat_history", "error_message")
    op.drop_column("chat_history", "execution_time_ms")
    op.drop_column("chat_history", "execution_status")
    op.drop_column("chat_history", "row_count")
    op.drop_column("chat_history", "result_data")
    op.drop_column("chat_history", "session_id")
