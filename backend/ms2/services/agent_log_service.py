"""Agent Log Service for tracking AI agent executions."""

import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from config.logging import get_logger
from models.ai_agent_log import AIAgentLog
from repositories.agent_log_repository import AIAgentLogRepository

logger = get_logger(__name__)


class AgentLogService:
    """Service for logging AI agent executions."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = AIAgentLogRepository(session)

    @staticmethod
    def _to_uuid(value: str) -> uuid.UUID:
        """Safely convert a string to UUID."""
        if isinstance(value, uuid.UUID):
            return value
        try:
            return uuid.UUID(str(value))
        except (ValueError, AttributeError):
            return uuid.uuid4()

    async def log_execution(
        self,
        session_id: str,
        user_id: str,
        interview_id: str,
        agent_name: str,
        node_name: str,
        input_data: dict,
        output_data: dict,
        execution_time_ms: int,
        prompt_tokens: int = 0,
        completion_tokens: int = 0,
        total_tokens: int = 0,
        status: str = "success",
    ) -> AIAgentLog:
        """Log a successful agent execution."""
        log = AIAgentLog(
            session_id=self._to_uuid(session_id),
            user_id=self._to_uuid(user_id),
            interview_id=interview_id,
            agent_name=agent_name,
            node_name=node_name,
            input_data=input_data,
            output_data=output_data,
            execution_time_ms=execution_time_ms,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            latency_ms=float(execution_time_ms),
            status=status,
        )
        return await self.repo.create(log)

    async def log_error(
        self,
        session_id: str,
        user_id: str,
        interview_id: str,
        agent_name: str,
        node_name: str,
        error: str,
        input_data: Optional[dict] = None,
        retry_count: int = 0,
    ) -> AIAgentLog:
        """Log a failed agent execution."""
        log = AIAgentLog(
            session_id=self._to_uuid(session_id),
            user_id=self._to_uuid(user_id),
            interview_id=interview_id,
            agent_name=agent_name,
            node_name=node_name,
            input_data=input_data or {},
            output_data={},
            execution_time_ms=0,
            latency_ms=0.0,
            status="failed",
            error_message=error,
            retry_count=retry_count,
        )
        return await self.repo.create(log)

    async def get_statistics(self, session_id: str) -> dict:
        """Get agent statistics for a session."""
        return await self.repo.get_agent_statistics(session_id)

    async def get_token_usage(self, session_id: str) -> dict:
        """Get total token usage for a session."""
        return await self.repo.get_token_usage_by_session(session_id)
