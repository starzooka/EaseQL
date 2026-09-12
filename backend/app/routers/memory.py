from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import get_current_user
from ..database import get_db
from ..models import User, UserMemory
from ..services import memory_service

router = APIRouter(prefix="/api/memories", tags=["memories"])


class MemoryCreate(BaseModel):
    memory_type: str = Field(min_length=1, max_length=100)
    key: str = Field(min_length=1, max_length=255)
    value: str = Field(min_length=1)
    source: str = Field(min_length=1, max_length=100)
    expires_at: datetime | None = None

    @field_validator("expires_at")
    @classmethod
    def validate_expires_at(cls, value: datetime | None) -> datetime | None:
        if value is not None and (value.tzinfo is None or value.utcoffset() is None):
            raise ValueError("expires_at must include a timezone")
        return value


class MemoryUpdate(BaseModel):
    memory_type: str | None = Field(default=None, min_length=1, max_length=100)
    key: str | None = Field(default=None, min_length=1, max_length=255)
    value: str | None = Field(default=None, min_length=1)
    source: str | None = Field(default=None, min_length=1, max_length=100)
    expires_at: datetime | None = None

    @field_validator("expires_at")
    @classmethod
    def validate_expires_at(cls, value: datetime | None) -> datetime | None:
        if value is not None and (value.tzinfo is None or value.utcoffset() is None):
            raise ValueError("expires_at must include a timezone")
        return value


def _memory_response(memory: UserMemory) -> dict:
    return {
        "id": memory.id,
        "memory_type": memory.memory_type,
        "key": memory.key,
        "value": memory.value,
        "source": memory.source,
        "created_at": memory.created_at,
        "updated_at": memory.updated_at,
        "expires_at": memory.expires_at,
    }


async def _get_owned_memory(memory_id: int, user_id: int, db: AsyncSession) -> UserMemory:
    result = await db.execute(select(UserMemory).where(UserMemory.id == memory_id, UserMemory.user_id == user_id))
    memory = result.scalar_one_or_none()
    if memory is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory not found")
    return memory


@router.get("")
async def list_memories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    memories = await memory_service.get_active_memories(db, current_user.id)
    return [_memory_response(memory) for memory in memories]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_memory(
    payload: MemoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    memory = await memory_service.create_memory(
        db,
        current_user.id,
        payload.memory_type,
        payload.key,
        payload.value,
        payload.source,
        payload.expires_at,
    )
    return _memory_response(memory)


@router.patch("/{memory_id}")
async def update_memory(
    memory_id: int,
    payload: MemoryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    memory = await _get_owned_memory(memory_id, current_user.id, db)
    updates = payload.model_dump(exclude_unset=True)
    memory = await memory_service.update_memory(db, memory, updates)
    return _memory_response(memory)


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_memory(
    memory_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    memory = await _get_owned_memory(memory_id, current_user.id, db)
    await memory_service.delete_memory(db, memory)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
