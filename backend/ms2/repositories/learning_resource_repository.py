"""Learning Resource repository for database operations."""

import uuid
from typing import Optional, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.learning_resource import LearningResource, RecommendedResource


class LearningResourceRepository:
    """Repository for learning resource database operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_resource(self, resource: LearningResource) -> LearningResource:
        """Create a new learning resource."""
        self.session.add(resource)
        await self.session.flush()
        await self.session.refresh(resource)
        return resource

    async def get_resource_by_id(self, resource_id: uuid.UUID) -> Optional[LearningResource]:
        """Get resource by ID."""
        result = await self.session.execute(
            select(LearningResource).where(LearningResource.id == resource_id)
        )
        return result.scalar_one_or_none()

    async def get_resources_by_skill(
        self,
        skill: str,
        limit: int = 20,
    ) -> Sequence[LearningResource]:
        """Get resources matching a skill (basic text search on skill_tags)."""
        result = await self.session.execute(
            select(LearningResource)
            .where(LearningResource.skill_tags.contains(skill))
            .where(LearningResource.is_active.is_(True))
            .limit(limit)
        )
        return result.scalars().all()

    async def get_resources_by_type(
        self,
        resource_type: str,
        limit: int = 20,
    ) -> Sequence[LearningResource]:
        """Get resources by type."""
        result = await self.session.execute(
            select(LearningResource)
            .where(LearningResource.resource_type == resource_type)
            .where(LearningResource.is_active.is_(True))
            .limit(limit)
        )
        return result.scalars().all()

    async def create_recommendation(self, recommendation: RecommendedResource) -> RecommendedResource:
        """Create a new recommendation."""
        self.session.add(recommendation)
        await self.session.flush()
        await self.session.refresh(recommendation)
        return recommendation

    async def get_recommendations_by_session(
        self,
        session_id: str,
    ) -> Sequence[RecommendedResource]:
        """Get all recommendations for a session."""
        result = await self.session.execute(
            select(RecommendedResource)
            .where(RecommendedResource.session_id == session_id)
            .order_by(RecommendedResource.priority)
        )
        return result.scalars().all()

    async def get_recommendations_by_interview(
        self,
        interview_id: str,
    ) -> Sequence[RecommendedResource]:
        """Get all recommendations for an interview."""
        result = await self.session.execute(
            select(RecommendedResource)
            .where(RecommendedResource.interview_id == interview_id)
            .order_by(RecommendedResource.priority)
        )
        return result.scalars().all()

    async def mark_recommendation_viewed(
        self,
        recommendation_id: uuid.UUID,
    ) -> Optional[RecommendedResource]:
        """Mark a recommendation as viewed."""
        result = await self.session.execute(
            select(RecommendedResource).where(RecommendedResource.id == recommendation_id)
        )
        rec = result.scalar_one_or_none()
        if rec:
            rec.is_viewed = True
            await self.session.flush()
            await self.session.refresh(rec)
        return rec

    async def mark_recommendation_completed(
        self,
        recommendation_id: uuid.UUID,
    ) -> Optional[RecommendedResource]:
        """Mark a recommendation as completed."""
        result = await self.session.execute(
            select(RecommendedResource).where(RecommendedResource.id == recommendation_id)
        )
        rec = result.scalar_one_or_none()
        if rec:
            rec.is_completed = True
            await self.session.flush()
            await self.session.refresh(rec)
        return rec
