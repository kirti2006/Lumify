"""AI Evaluation repository for database operations."""

import uuid
from typing import Optional, Sequence

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.ai_evaluation import AIEvaluation
from schemas.common import PaginationParams


class AIEvaluationRepository:
    """Repository for AI evaluation database operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, evaluation: AIEvaluation) -> AIEvaluation:
        """Create a new AI evaluation."""
        self.session.add(evaluation)
        await self.session.flush()
        await self.session.refresh(evaluation)
        return evaluation

    async def get_by_id(self, evaluation_id: uuid.UUID) -> Optional[AIEvaluation]:
        """Get evaluation by ID."""
        result = await self.session.execute(
            select(AIEvaluation).where(AIEvaluation.id == evaluation_id)
        )
        return result.scalar_one_or_none()

    async def get_by_session_id(
        self,
        session_id: str,
        pagination: Optional[PaginationParams] = None,
    ) -> Sequence[AIEvaluation]:
        """Get all evaluations for a session."""
        query = select(AIEvaluation).where(AIEvaluation.session_id == session_id)

        if pagination:
            offset = (pagination.page - 1) * pagination.page_size
            query = query.offset(offset).limit(pagination.page_size)

        if pagination and pagination.sort_by:
            sort_column = getattr(AIEvaluation, pagination.sort_by, AIEvaluation.created_at)
            if pagination.sort_order == "desc":
                query = query.order_by(desc(sort_column))
            else:
                query = query.order_by(sort_column)
        else:
            query = query.order_by(desc(AIEvaluation.created_at))

        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_by_interview_id(
        self,
        interview_id: str,
        pagination: Optional[PaginationParams] = None,
    ) -> Sequence[AIEvaluation]:
        """Get all evaluations for an interview."""
        query = select(AIEvaluation).where(AIEvaluation.interview_id == interview_id)

        if pagination:
            offset = (pagination.page - 1) * pagination.page_size
            query = query.offset(offset).limit(pagination.page_size)

        query = query.order_by(desc(AIEvaluation.created_at))
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_latest_by_session(self, session_id: str) -> Optional[AIEvaluation]:
        """Get the most recent evaluation for a session."""
        result = await self.session.execute(
            select(AIEvaluation)
            .where(AIEvaluation.session_id == session_id)
            .order_by(desc(AIEvaluation.created_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_average_scores(self, session_id: str) -> dict:
        """Get average scores for a session."""
        result = await self.session.execute(
            select(
                func.avg(AIEvaluation.overall_score).label("avg_overall"),
                func.avg(AIEvaluation.correctness_score).label("avg_correctness"),
                func.avg(AIEvaluation.communication_score).label("avg_communication"),
                func.avg(AIEvaluation.confidence_score).label("avg_confidence"),
                func.avg(AIEvaluation.technical_accuracy_score).label("avg_technical"),
                func.avg(AIEvaluation.star_format_score).label("avg_star"),
                func.avg(AIEvaluation.depth_score).label("avg_depth"),
                func.count(AIEvaluation.id).label("total_count"),
            ).where(AIEvaluation.session_id == session_id)
        )
        row = result.one()
        return {
            "avg_overall": float(row.avg_overall) if row.avg_overall else 0.0,
            "avg_correctness": float(row.avg_correctness) if row.avg_correctness else 0.0,
            "avg_communication": float(row.avg_communication) if row.avg_communication else 0.0,
            "avg_confidence": float(row.avg_confidence) if row.avg_confidence else 0.0,
            "avg_technical": float(row.avg_technical) if row.avg_technical else 0.0,
            "avg_star": float(row.avg_star) if row.avg_star else 0.0,
            "avg_depth": float(row.avg_depth) if row.avg_depth else 0.0,
            "total_count": row.total_count or 0,
        }

    async def update(self, evaluation: AIEvaluation) -> AIEvaluation:
        """Update an existing evaluation."""
        await self.session.flush()
        await self.session.refresh(evaluation)
        return evaluation

    async def delete(self, evaluation_id: uuid.UUID) -> bool:
        """Delete an evaluation."""
        result = await self.session.execute(
            select(AIEvaluation).where(AIEvaluation.id == evaluation_id)
        )
        evaluation = result.scalar_one_or_none()
        if evaluation:
            await self.session.delete(evaluation)
            await self.session.flush()
            return True
        return False

    async def count_by_session(self, session_id: str) -> int:
        """Count evaluations for a session."""
        result = await self.session.execute(
            select(func.count(AIEvaluation.id)).where(AIEvaluation.session_id == session_id)
        )
        return result.scalar() or 0
