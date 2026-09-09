from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..auth import get_current_user
from ..database import get_db
from ..models import ChatHistory, ChatMessage, ChatMessageRole, ChatSession, User

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatSessionCreate(BaseModel):
    title: str | None = Field(default=None, max_length=255)


class ChatMessageCreate(BaseModel):
    role: ChatMessageRole
    content: str = Field(min_length=1)


def _message_response(message: ChatMessage) -> dict:
    return {
        "id": message.id,
        "role": message.role.value,
        "content": message.content,
        "created_at": message.created_at,
    }


def _query_response(query: ChatHistory) -> dict:
    return {
        "id": query.id,
        "natural_language_query": query.natural_language_query,
        "generated_sql": query.generated_sql,
        "result_data": query.result_data,
        "row_count": query.row_count,
        "execution_status": query.execution_status,
        "execution_time_ms": query.execution_time_ms,
        "created_at": query.created_at,
    }


def _session_response(session: ChatSession, include_messages: bool = False) -> dict:
    response = {
        "id": session.id,
        "title": session.title,
        "created_at": session.created_at,
        "updated_at": session.updated_at,
    }
    if include_messages:
        response["messages"] = [_message_response(message) for message in session.messages]
    return response


@router.post("/sessions", status_code=status.HTTP_201_CREATED)
async def create_session(
    payload: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    session = ChatSession(user_id=current_user.id, title=payload.title)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return _session_response(session)


@router.get("/sessions")
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc(), ChatSession.created_at.desc())
    )
    return [_session_response(session) for session in result.scalars().all()]


@router.get("/sessions/{session_id}")
async def get_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(ChatSession)
        .options(selectinload(ChatSession.messages))
        .where(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")
    return _session_response(session, include_messages=True)


@router.post("/sessions/{session_id}/messages", status_code=status.HTTP_201_CREATED)
async def create_message(
    session_id: int,
    payload: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")

    message = ChatMessage(
        session_id=session.id,
        user_id=current_user.id,
        role=payload.role,
        content=payload.content,
    )
    session.updated_at = func.now()
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return _message_response(message)


@router.get("/sessions/{session_id}/messages")
async def list_messages(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    session_result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    )
    if session_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")

    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc(), ChatMessage.id.asc())
    )
    return [_message_response(message) for message in result.scalars().all()]


@router.get("/sessions/{session_id}/queries")
async def list_session_queries(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    session_result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    )
    if session_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")

    result = await db.execute(
        select(ChatHistory)
        .where(ChatHistory.session_id == session_id, ChatHistory.user_id == current_user.id)
        .order_by(ChatHistory.created_at.desc(), ChatHistory.id.desc())
    )
    return [_query_response(query) for query in result.scalars().all()]


@router.get("/queries/{query_id}")
async def get_query_result(
    query_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(ChatHistory).where(ChatHistory.id == query_id, ChatHistory.user_id == current_user.id)
    )
    query = result.scalar_one_or_none()
    if query is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Query history not found")
    return _query_response(query)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")

    await db.delete(session)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
