"""Learning Resource Service for managing learning resources."""

import uuid
from typing import Optional, Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from models.learning_resource import LearningResource, RecommendedResource
from repositories.learning_resource_repository import LearningResourceRepository


class LearningResourceService:
    """Service for managing learning resources and recommendations."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = LearningResourceRepository(session)

    async def create_resource(
        self,
        title: str,
        url: str,
        resource_type: str,
        skill_tags: list,
        difficulty_level: str,
        description: Optional[str] = None,
        duration_minutes: Optional[int] = None,
        provider: Optional[str] = None,
        is_free: bool = True,
        rating: Optional[float] = None,
    ) -> LearningResource:
        """Create a new learning resource."""
        resource = LearningResource(
            title=title,
            description=description,
            resource_type=resource_type,
            url=url,
            skill_tags=skill_tags,
            difficulty_level=difficulty_level,
            duration_minutes=duration_minutes,
            provider=provider,
            is_free=is_free,
            rating=rating,
        )
        return await self.repo.create_resource(resource)

    async def get_resource(self, resource_id: uuid.UUID) -> Optional[LearningResource]:
        """Get a resource by ID."""
        return await self.repo.get_resource_by_id(resource_id)

    async def get_resources_by_skill(
        self,
        skill: str,
        limit: int = 20,
    ) -> Sequence[LearningResource]:
        """Get resources for a specific skill."""
        return await self.repo.get_resources_by_skill(skill, limit)

    async def create_recommendation(
        self,
        session_id: str,
        user_id: str,
        interview_id: str,
        resource_id: uuid.UUID,
        skill_gap: str,
        priority: int,
        reason: str,
        relevance_score: float = 0.5,
    ) -> RecommendedResource:
        """Create a resource recommendation."""
        recommendation = RecommendedResource(
            session_id=session_id,
            user_id=user_id,
            interview_id=interview_id,
            learning_resource_id=resource_id,
            skill_gap=skill_gap,
            priority=priority,
            relevance_score=relevance_score,
            reason=reason,
        )
        return await self.repo.create_recommendation(recommendation)

    async def get_session_recommendations(
        self,
        session_id: str,
    ) -> Sequence[RecommendedResource]:
        """Get all recommendations for a session."""
        return await self.repo.get_recommendations_by_session(session_id)

    async def get_interview_recommendations(
        self,
        interview_id: str,
    ) -> Sequence[RecommendedResource]:
        """Get all recommendations for an interview."""
        return await self.repo.get_recommendations_by_interview(interview_id)

    async def mark_viewed(self, recommendation_id: uuid.UUID) -> Optional[RecommendedResource]:
        """Mark a recommendation as viewed."""
        return await self.repo.mark_recommendation_viewed(recommendation_id)

    async def mark_completed(
        self,
        recommendation_id: uuid.UUID,
    ) -> Optional[RecommendedResource]:
        """Mark a recommendation as completed."""
        return await self.repo.mark_recommendation_completed(recommendation_id)
