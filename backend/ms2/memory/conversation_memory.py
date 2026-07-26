"""Conversation memory backed by Redis."""

from typing import Any, Dict, List, Optional

import redis.asyncio as aioredis

from config.logging import get_logger
from config.settings import get_settings

logger = get_logger(__name__)
settings = get_settings()


class ConversationMemory:
    """Manages conversation history in Redis for interview sessions."""

    def __init__(self, redis_client: Optional[aioredis.Redis] = None):
        """Initialize conversation memory.

        Args:
            redis_client: Optional existing Redis client. If not provided,
                         creates a new connection from settings.
        """
        self._redis = redis_client
        self._key_prefix = "lumify:conversation:"

    async def _get_redis(self) -> aioredis.Redis:
        """Get or create Redis client."""
        if self._redis is None:
            self._redis = await aioredis.from_url(
                settings.redis_url,
                max_connections=settings.redis_max_connections,
                decode_responses=True,
            )
        return self._redis

    def _session_key(self, session_id: str) -> str:
        """Generate Redis key for a session."""
        return f"{self._key_prefix}{session_id}"

    async def add_message(
        self,
        session_id: str,
        message_type: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Add a message to conversation history.

        Args:
            session_id: Interview session ID
            message_type: 'question' or 'answer'
            content: Message content
            metadata: Optional metadata (scores, agent info, etc.)
        """
        import json

        redis = await self._get_redis()
        key = self._session_key(session_id)

        message = {
            "type": message_type,
            "content": content,
            "metadata": metadata or {},
        }

        await redis.rpush(key, json.dumps(message))
        await redis.expire(key, settings.session_ttl_seconds)

        history_length = await redis.llen(key)
        if history_length > settings.max_conversation_history:
            await redis.ltrim(key, -settings.max_conversation_history, -1)

        logger.debug(
            f"Added {message_type} to session {session_id}",
            extra={"session_id": session_id, "history_length": history_length},
        )

    async def get_history(
        self,
        session_id: str,
        limit: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Get conversation history for a session.

        Args:
            session_id: Interview session ID
            limit: Maximum number of messages to return (from most recent)

        Returns:
            List of message dictionaries
        """
        import json

        redis = await self._get_redis()
        key = self._session_key(session_id)

        if limit:
            raw_messages = await redis.lrange(key, -limit, -1)
        else:
            raw_messages = await redis.lrange(key, 0, -1)

        return [json.loads(msg) for msg in raw_messages]

    async def clear_history(self, session_id: str) -> None:
        """Clear conversation history for a session."""
        redis = await self._get_redis()
        key = self._session_key(session_id)
        await redis.delete(key)
        logger.info(f"Cleared conversation history for session {session_id}")

    async def get_message_count(self, session_id: str) -> int:
        """Get the number of messages in a session."""
        redis = await self._get_redis()
        key = self._session_key(session_id)
        return await redis.llen(key)

    async def close(self) -> None:
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()
            self._redis = None


_memory_instance: Optional[ConversationMemory] = None


def get_conversation_memory() -> ConversationMemory:
    """Get the singleton conversation memory instance."""
    global _memory_instance
    if _memory_instance is None:
        _memory_instance = ConversationMemory()
    return _memory_instance


async def close_conversation_memory() -> None:
    """Close the conversation memory."""
    global _memory_instance
    if _memory_instance:
        await _memory_instance.close()
        _memory_instance = None
