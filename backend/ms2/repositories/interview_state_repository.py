"""Interview State repository for database operations."""

import uuid
from datetime import datetime
from typing import Optional, Sequence

from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.interview_state import InterviewState


class InterviewStateRepository:
    """Repository for interview state database operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, state: InterviewState) -> InterviewState:
        """Create a new interview state."""
        self.session.add(state)
        await self.session.flush()
        await self.session.refresh(state)
        return state

    async def get_by_id(self, state_id: uuid.UUID) -> Optional[InterviewState]:
        """Get state by ID."""
        result = await self.session.execute(
            select(InterviewState).where(InterviewState.id == state_id)
        )
        return result.scalar_one_or_none()

    async def get_by_session_id(self, session_id: str) -> Optional[InterviewState]:
        """Get state by session ID."""
        result = await self.session.execute(
            select(InterviewState).where(InterviewState.session_id == session_id)
        )
        return result.scalar_one_or_none()

    async def get_active_by_user(
        self,
        user_id: str,
        limit: int = 10,
    ) -> Sequence[InterviewState]:
        """Get active interview states for a user."""
        result = await self.session.execute(
            select(InterviewState)
            .where(InterviewState.user_id == user_id)
            .order_by(desc(InterviewState.last_activity_at))
            .limit(limit)
        )
        return result.scalars().all()

    async def get_by_interview_id(
        self,
        interview_id: str,
    ) -> Sequence[InterviewState]:
        """Get all states for an interview."""
        result = await self.session.execute(
            select(InterviewState)
            .where(InterviewState.interview_id == interview_id)
            .order_by(desc(InterviewState.created_at))
        )
        return result.scalars().all()

    async def update(self, state: InterviewState) -> InterviewState:
        """Update an existing interview state."""
        state.updated_at = datetime.utcnow()
        state.last_activity_at = datetime.utcnow()
        await self.session.flush()
        await self.session.refresh(state)
        return state

    async def update_conversation(
        self,
        session_id: str,
        new_question: Optional[str] = None,
        new_answer: Optional[str] = None,
    ) -> Optional[InterviewState]:
        """Update conversation history atomically."""
        state = await self.get_by_session_id(session_id)
        if not state:
            return None

        history = state.conversation_history.copy()
        if new_question:
            history.append({"type": "question", "content": new_question})
            state.previous_questions = state.previous_questions + [new_question]
            state.current_question = new_question
            state.total_questions_asked += 1

        if new_answer:
            history.append({"type": "answer", "content": new_answer})

        state.conversation_history = history
        state.last_activity_at = datetime.utcnow()
        await self.session.flush()
        await self.session.refresh(state)
        return state

    async def update_skill_scores(
        self,
        session_id: str,
        skill_scores: dict,
    ) -> Optional[InterviewState]:
        """Update skill scores atomically."""
        state = await self.get_by_session_id(session_id)
        if not state:
            return None

        current_scores = state.skill_scores.copy()
        current_scores.update(skill_scores)
        state.skill_scores = current_scores
        state.last_activity_at = datetime.utcnow()
        await self.session.flush()
        await self.session.refresh(state)
        return state

    async def update_state_progress(
        self,
        session_id: str,
        new_state: str,
    ) -> Optional[InterviewState]:
        """Update the current state progress."""
        state = await self.get_by_session_id(session_id)
        if not state:
            return None

        state.current_state = new_state
        state.last_activity_at = datetime.utcnow()
        await self.session.flush()
        await self.session.refresh(state)
        return state

    async def delete(self, session_id: str) -> bool:
        """Delete interview state by session ID."""
        result = await self.session.execute(
            select(InterviewState).where(InterviewState.session_id == session_id)
        )
        state = result.scalar_one_or_none()
        if state:
            await self.session.delete(state)
            await self.session.flush()
            return True
        return False

    async def count_by_user(self, user_id: str) -> int:
        """Count interview states for a user."""
        result = await self.session.execute(
            select(func.count(InterviewState.id)).where(InterviewState.user_id == user_id)
        )
        return result.scalar() or 0

    async def cleanup_stale_states(self, hours: int = 24) -> int:
        """Clean up states with no activity for specified hours."""
        from datetime import timedelta

        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        result = await self.session.execute(
            select(InterviewState).where(
                and_(
                    InterviewState.last_activity_at < cutoff_time,
                    InterviewState.current_state.in_(["completed", "ended"]),
                )
            )
        )
        stale_states = result.scalars().all()
        for state in stale_states:
            await self.session.delete(state)
        await self.session.flush()
        return len(stale_states)
