"""AI Evaluation model for storing interview evaluations."""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, DateTime, Float, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from config.database import Base


class AIEvaluation(Base):
    """Stores AI evaluations for interview answers."""

    __tablename__ = "ai_evaluations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    session_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    interview_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    question: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str] = mapped_column(String(50), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(20), nullable=False)

    answer: Mapped[str] = mapped_column(Text, nullable=False)

    evaluation: Mapped[dict] = mapped_column(JSON, nullable=False)

    correctness_score: Mapped[float] = mapped_column(Float, nullable=False)
    communication_score: Mapped[float] = mapped_column(Float, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    technical_accuracy_score: Mapped[float] = mapped_column(Float, nullable=False)
    star_format_score: Mapped[float] = mapped_column(Float, nullable=False)
    depth_score: Mapped[float] = mapped_column(Float, nullable=False)
    overall_score: Mapped[float] = mapped_column(Float, nullable=False)

    strengths: Mapped[list] = mapped_column(JSON, nullable=False)
    weaknesses: Mapped[list] = mapped_column(JSON, nullable=False)
    improvement_suggestions: Mapped[list] = mapped_column(JSON, nullable=False)

    emotion_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    follow_up_question: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    prompt_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    completion_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        Index("idx_evaluation_session_created", "session_id", "created_at"),
        Index("idx_evaluation_user_created", "user_id", "created_at"),
        Index("idx_evaluation_interview", "interview_id", "question_type"),
    )

    def __repr__(self) -> str:
        return f"<AIEvaluation(id={self.id}, session_id={self.session_id}, overall_score={self.overall_score})>"
