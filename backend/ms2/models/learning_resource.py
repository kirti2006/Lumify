"""Learning Resource and Recommended Resource models."""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from config.database import Base


class LearningResource(Base):
    """Stores available learning resources."""

    __tablename__ = "learning_resources"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    skill_tags: Mapped[list] = mapped_column(Text, nullable=False, default="[]")
    difficulty_level: Mapped[str] = mapped_column(String(20), nullable=False, default="intermediate")
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    provider: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_free: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    recommendations: Mapped[list["RecommendedResource"]] = relationship(
        back_populates="resource", lazy="selectin"
    )

    __table_args__ = (
        Index("idx_learning_resource_type", "resource_type"),
        Index("idx_learning_resource_difficulty", "difficulty_level"),
    )

    def __repr__(self) -> str:
        return f"<LearningResource(id={self.id}, title={self.title})>"


class RecommendedResource(Base):
    """Stores resource recommendations for interview sessions."""

    __tablename__ = "recommended_resources"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    session_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    interview_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    learning_resource_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("learning_resources.id"),
        nullable=False,
    )
    skill_gap: Mapped[str] = mapped_column(String(100), nullable=False)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    relevance_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.5)
    reason: Mapped[str] = mapped_column(Text, nullable=False)

    is_viewed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    resource: Mapped["LearningResource"] = relationship(
        back_populates="recommendations", lazy="selectin"
    )

    __table_args__ = (
        Index("idx_recommended_session", "session_id"),
        Index("idx_recommended_user", "user_id"),
        Index("idx_recommended_interview", "interview_id"),
    )

    def __repr__(self) -> str:
        return f"<RecommendedResource(id={self.id}, skill_gap={self.skill_gap})>"
