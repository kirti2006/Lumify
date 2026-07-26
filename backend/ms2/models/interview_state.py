"""Interview State model for persisting interview conversation state."""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, DateTime, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from config.database import Base


class InterviewState(Base):
    """Stores interview state and conversation history."""

    __tablename__ = "interview_states"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    session_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    interview_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    jd_summary: Mapped[dict] = mapped_column(JSON, nullable=False)

    extracted_skills: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    missing_skills: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    experience_years: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    education_level: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    projects: Mapped[list] = mapped_column(JSON, nullable=False, default=list)

    role_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    company_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    required_skills: Mapped[list] = mapped_column(JSON, nullable=False, default=list)

    difficulty_level: Mapped[str] = mapped_column(String(20), nullable=False, default="medium")

    previous_questions: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    conversation_history: Mapped[list] = mapped_column(JSON, nullable=False, default=list)

    skill_scores: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    current_question: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    current_question_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    current_emotion_score: Mapped[Optional[float]] = mapped_column(Integer, nullable=True)
    evaluation_summary: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    feedback_summary: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    current_state: Mapped[str] = mapped_column(String(50), nullable=False, default="initialized")
    total_questions_asked: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_evaluations: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    state_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    last_activity_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        Index("idx_interview_state_user", "user_id", "last_activity_at"),
        Index("idx_interview_state_interview", "interview_id", "session_id"),
    )

    def __repr__(self) -> str:
        return f"<InterviewState(session_id={self.session_id}, current_state={self.current_state})>"
