"""Interview State Service for managing interview state."""

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from models.interview_state import InterviewState
from repositories.interview_state_repository import InterviewStateRepository


class InterviewStateService:
    """Service for managing interview state."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = InterviewStateRepository(session)

    async def create_state(
        self,
        session_id: str,
        user_id: str,
        interview_id: str,
        jd_summary: dict,
    ) -> InterviewState:
        """Create a new interview state."""
        state = InterviewState(
            session_id=session_id,
            user_id=user_id,
            interview_id=interview_id,
            jd_summary=jd_summary,
        )
        return await self.repo.create(state)

    async def get_state(self, session_id: str) -> Optional[InterviewState]:
        """Get interview state by session ID."""
        return await self.repo.get_by_session_id(session_id)

    async def update_state(self, state: InterviewState) -> InterviewState:
        """Update an existing state."""
        return await self.repo.update(state)

    async def add_question_to_history(
        self,
        session_id: str,
        question: str,
        question_type: Optional[str] = None,
    ) -> Optional[InterviewState]:
        """Add a question to conversation history."""
        state = await self.repo.get_by_session_id(session_id)
        if state:
            state.previous_questions = state.previous_questions + [question]
            state.conversation_history = state.conversation_history + [
                {"type": "question", "content": question, "question_type": question_type}
            ]
            state.current_question = question
            state.current_question_type = question_type
            state.total_questions_asked += 1
            return await self.repo.update(state)
        return None

    async def add_answer_to_history(self, session_id: str, answer: str) -> Optional[InterviewState]:
        """Add an answer to conversation history."""
        state = await self.repo.get_by_session_id(session_id)
        if state:
            state.conversation_history = state.conversation_history + [
                {"type": "answer", "content": answer}
            ]
            return await self.repo.update(state)
        return None

    async def update_skill_scores(
        self,
        session_id: str,
        skill_scores: dict,
    ) -> Optional[InterviewState]:
        """Update skill scores."""
        return await self.repo.update_skill_scores(session_id, skill_scores)

    async def update_evaluation_summary(
        self,
        session_id: str,
        evaluation_summary: dict,
    ) -> Optional[InterviewState]:
        """Update evaluation summary."""
        state = await self.repo.get_by_session_id(session_id)
        if state:
            state.evaluation_summary = evaluation_summary
            state.total_evaluations += 1
            return await self.repo.update(state)
        return None

    async def advance_state(
        self,
        session_id: str,
        new_state: str,
    ) -> Optional[InterviewState]:
        """Advance the interview state machine."""
        return await self.repo.update_state_progress(session_id, new_state)
