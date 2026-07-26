"""Redis configuration and connection management."""

from contextvars import ContextVar
from typing import AsyncGenerator, Optional

from redis.asyncio import ConnectionPool, Redis

from config.settings import get_settings

settings = get_settings()

_redis_pool: Optional[ConnectionPool] = None
_redis_client: ContextVar[Optional[Redis]] = ContextVar("redis_client", default=None)


async def init_redis() -> ConnectionPool:
    """Initialize Redis connection pool."""
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = ConnectionPool.from_url(
            settings.redis_url,
            max_connections=settings.redis_max_connections,
            decode_responses=True,
        )
    return _redis_pool


async def get_redis() -> AsyncGenerator[Redis, None]:
    """Get Redis client dependency for FastAPI."""
    pool = await init_redis()
    client = _redis_client.get()
    if client is None:
        client = Redis(connection_pool=pool)
        _redis_client.set(client)
    try:
        yield client
    finally:
        pass


async def close_redis() -> None:
    """Close Redis connections."""
    global _redis_pool
    client = _redis_client.get()
    if client:
        await client.aclose()
        _redis_client.set(None)
    if _redis_pool:
        await _redis_pool.disconnect()
        _redis_pool = None
