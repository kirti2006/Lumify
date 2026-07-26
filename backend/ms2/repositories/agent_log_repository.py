"""AI Agent Log repository for database operations."""

import uuid
from datetime import datetime, timedelta
from typing import Optional, Sequence

from sqlalchemy import and_, delete, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.ai_agent_log import AIAgentLog


class AIAgentLogRepository:
    """Repository for AI agent log database operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, log: AIAgentLog) -> AIAgentLog:
        """Create a new agent log entry."""
        self.session.add(log)
        await self.session.flush()
        await self.session.refresh(log)
        return log

    async def get_by_id(self, log_id: uuid.UUID) -> Optional[AIAgentLog]:
        """Get log by ID."""
        result = await self.session.execute(
            select(AIAgentLog).where(AIAgentLog.id == log_id)
        )
        return result.scalar_one_or_none()

    async def get_by_session_id(
        self,
        session_id: str,
        agent_name: Optional[str] = None,
        limit: int = 100,
    ) -> Sequence[AIAgentLog]:
        """Get logs for a session, optionally filtered by agent name."""
        query = select(AIAgentLog).where(AIAgentLog.session_id == session_id)

        if agent_name:
            query = query.where(AIAgentLog.agent_name == agent_name)

        query = query.order_by(desc(AIAgentLog.called_at)).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_by_interview_id(
        self,
        interview_id: str,
        limit: int = 100,
    ) -> Sequence[AIAgentLog]:
        """Get logs for an interview."""
        result = await self.session.execute(
            select(AIAgentLog)
            .where(AIAgentLog.interview_id == interview_id)
            .order_by(desc(AIAgentLog.called_at))
            .limit(limit)
        )
        return result.scalars().all()

    async def get_failed_logs(
        self,
        session_id: str,
        limit: int = 50,
    ) -> Sequence[AIAgentLog]:
        """Get failed logs for a session."""
        result = await self.session.execute(
            select(AIAgentLog)
            .where(
                and_(
                    AIAgentLog.session_id == session_id,
                    AIAgentLog.status == "failed",
                )
            )
            .order_by(desc(AIAgentLog.called_at))
            .limit(limit)
        )
        return result.scalars().all()

    async def get_agent_statistics(self, session_id: str) -> dict:
        """Get aggregated statistics for agents in a session."""
        result = await self.session.execute(
            select(
                AIAgentLog.agent_name,
                func.count(AIAgentLog.id).label("call_count"),
                func.avg(AIAgentLog.execution_time_ms).label("avg_execution_time"),
                func.sum(AIAgentLog.prompt_tokens).label("total_prompt_tokens"),
                func.sum(AIAgentLog.completion_tokens).label("total_completion_tokens"),
                func.sum(AIAgentLog.total_tokens).label("total_tokens"),
                func.avg(AIAgentLog.latency_ms).label("avg_latency"),
            )
            .where(AIAgentLog.session_id == session_id)
            .group_by(AIAgentLog.agent_name)
        )
        rows = result.all()
        return {
            "agents": [
                {
                    "agent_name": row.agent_name,
                    "call_count": row.call_count,
                    "avg_execution_time_ms": float(row.avg_execution_time) if row.avg_execution_time else 0,
                    "total_prompt_tokens": row.total_prompt_tokens or 0,
                    "total_completion_tokens": row.total_completion_tokens or 0,
                    "total_tokens": row.total_tokens or 0,
                    "avg_latency_ms": float(row.avg_latency) if row.avg_latency else 0,
                }
                for row in rows
            ]
        }

    async def get_token_usage_by_session(self, session_id: str) -> dict:
        """Get total token usage for a session."""
        result = await self.session.execute(
            select(
                func.sum(AIAgentLog.prompt_tokens).label("total_prompt_tokens"),
                func.sum(AIAgentLog.completion_tokens).label("total_completion_tokens"),
                func.sum(AIAgentLog.total_tokens).label("total_tokens"),
                func.count(AIAgentLog.id).label("total_calls"),
            ).where(AIAgentLog.session_id == session_id)
        )
        row = result.one()
        return {
            "total_prompt_tokens": row.total_prompt_tokens or 0,
            "total_completion_tokens": row.total_completion_tokens or 0,
            "total_tokens": row.total_tokens or 0,
            "total_calls": row.total_calls or 0,
        }

    async def delete_old_logs(self, days: int = 30) -> int:
        """Delete logs older than specified days."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        result = await self.session.execute(
            delete(AIAgentLog).where(AIAgentLog.called_at < cutoff_date)
        )
        await self.session.flush()
        return result.rowcount

    async def count_by_session(self, session_id: str) -> int:
        """Count logs for a session."""
        result = await self.session.execute(
            select(func.count(AIAgentLog.id)).where(AIAgentLog.session_id == session_id)
        )
        return result.scalar() or 0
