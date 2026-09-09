"""add chat sessions and messages

Revision ID: a8c4d2e6f901
Revises: fe724a4941e3
Create Date: 2026-09-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a8c4d2e6f901"
down_revision: Union[str, Sequence[str], None] = "fe724a4941e3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


chat_message_role = sa.Enum("user", "assistant", "system", name="chat_message_role")


def upgrade() -> None:
    """Create persistent chat session and message tables."""
    bind = op.get_bind()
    chat_message_role.create(bind, checkfirst=True)

    if bind.dialect.name == "postgresql":
        enum_values = bind.execute(
            sa.text(
                "SELECT enumlabel FROM pg_enum "
                "WHERE enumtypid = 'chat_message_role'::regtype ORDER BY enumsortorder"
            )
        ).scalars().all()
        for old_value, new_value in zip(("USER", "ASSISTANT", "SYSTEM"), ("user", "assistant", "system")):
            if old_value in enum_values and new_value not in enum_values:
                bind.execute(sa.text(f"ALTER TYPE chat_message_role RENAME VALUE '{old_value}' TO '{new_value}'"))

    inspector = sa.inspect(bind)
    table_names = set(inspector.get_table_names())

    if "chat_sessions" not in table_names:
        op.create_table(
            "chat_sessions",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("title", sa.String(length=255), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )

    if "chat_messages" not in table_names:
        op.create_table(
            "chat_messages",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("session_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("role", chat_message_role, nullable=False),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["session_id"], ["chat_sessions.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )

    indexes = {
        table_name: {index["name"] for index in inspector.get_indexes(table_name)}
        for table_name in ("chat_sessions", "chat_messages")
    }
    for index_name, table_name, columns in (
        ("ix_chat_sessions_id", "chat_sessions", ["id"]),
        ("ix_chat_sessions_user_id", "chat_sessions", ["user_id"]),
        ("ix_chat_messages_id", "chat_messages", ["id"]),
        ("ix_chat_messages_session_id", "chat_messages", ["session_id"]),
        ("ix_chat_messages_user_id", "chat_messages", ["user_id"]),
    ):
        if index_name not in indexes[table_name]:
            op.create_index(index_name, table_name, columns, unique=False)


def downgrade() -> None:
    """Drop persistent chat message and session tables."""
    op.drop_index(op.f("ix_chat_messages_user_id"), table_name="chat_messages")
    op.drop_index(op.f("ix_chat_messages_session_id"), table_name="chat_messages")
    op.drop_index(op.f("ix_chat_messages_id"), table_name="chat_messages")
    op.drop_table("chat_messages")
    op.drop_index(op.f("ix_chat_sessions_user_id"), table_name="chat_sessions")
    op.drop_index(op.f("ix_chat_sessions_id"), table_name="chat_sessions")
    op.drop_table("chat_sessions")
    chat_message_role.drop(op.get_bind(), checkfirst=True)
