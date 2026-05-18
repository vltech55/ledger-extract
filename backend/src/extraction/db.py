from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from extraction.core.config import settings


class Base(DeclarativeBase):
    pass


# Async pool for the FastAPI app (one event loop, many requests).
engine = create_async_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=10,
    future=True,
)
SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)


# Sync pool for Celery workers. Celery's prefork worker doesn't share an event loop,
# and mixing asyncio with prefork is fragile; sync SQLAlchemy is the well-trodden path.
sync_engine = create_engine(
    settings.database_url_sync,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=5,
    future=True,
)
SyncSessionLocal = sessionmaker(bind=sync_engine, expire_on_commit=False, class_=Session)


async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as s:
        try:
            yield s
        except Exception:
            await s.rollback()
            raise
