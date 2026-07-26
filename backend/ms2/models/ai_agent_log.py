"""AI Agent Log model for tracking agent execution."""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, DateTime, Float, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from config.database import Base


class AIAgentLog(Base):
    """Stores logs for AI agent executions."""

    __tablename__ = "ai_agent_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    interview_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    agent_name: Mapped[str] = mapped_column(String(100), nullable=False)
    node_name: Mapped[str] = mapped_column(String(100), nullable=False)

    input_data: Mapped[dict] = mapped_column(JSON, nullable=False)
    output_data: Mapped[dict] = mapped_column(JSON, nullable=False)

    execution_time_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    prompt_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    completion_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    latency_ms: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    status: Mapped[str] = mapped_column(String(20), nullable=False, default="success")
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    called_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    __table_args__ = (
        Index("idx_agent_log_session_agent", "session_id", "agent_name"),
        Index("idx_agent_log_user_created", "user_id", "called_at"),
        Index("idx_agent_log_interview", "interview_id", "agent_name"),
    )

    def __repr__(self) -> str:
        return f"<AIAgentLog(id={self.id}, agent_name={self.agent_name}, status={self.status})>"
