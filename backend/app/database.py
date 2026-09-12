import os
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from .models import Base

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
SessionLocal: async_sessionmaker[AsyncSession] | None = None

if DATABASE_URL:
    if DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif DATABASE_URL.startswith("postgresql+psycopg2://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)

    parsed_url = urlsplit(DATABASE_URL)
    query_params = dict(parse_qsl(parsed_url.query, keep_blank_values=True))
    connect_args = {}

    for unsupported_key in ("sslmode", "channel_binding"):
        query_params.pop(unsupported_key, None)

    if query_params:
        DATABASE_URL = urlunsplit(parsed_url._replace(query=urlencode(query_params, doseq=True)))
    else:
        DATABASE_URL = urlunsplit(parsed_url._replace(query=""))

    if DATABASE_URL.startswith("postgresql+asyncpg://"):
        connect_args["ssl"] = True

    # Keep pool sizes conservative for serverless Postgres while still reusing connections.
    engine = create_async_engine(
        DATABASE_URL,
        connect_args=connect_args,
        pool_pre_ping=True,
        pool_size=int(os.getenv("DB_POOL_SIZE", "5")),
        max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "2")),
        pool_timeout=int(os.getenv("DB_POOL_TIMEOUT", "30")),
        pool_recycle=int(os.getenv("DB_POOL_RECYCLE", "1800")),
        pool_use_lifo=True,
    )
    SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    if SessionLocal is None:
        raise RuntimeError("DATABASE_URL is not set. Add it to backend/.env")
    async with SessionLocal() as session:
        yield session
