"""Tests for services."""

from unittest.mock import MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from services.agent_log_service import AgentLogService
from services.ai_service import AIService
from services.interview_state_service import InterviewStateService


class TestAgentLogService:
    """Tests for AgentLogService."""

    @pytest.mark.asyncio
    async def test_log_execution(self, db_session: AsyncSession):
        """Test logging successful agent execution."""
        service = AgentLogService(db_session)

        log = await service.log_execution(
            session_id="test_session",
            user_id="test_user",
            interview_id="test_interview",
            agent_name="TestAgent",
            node_name="test_node",
            input_data={"test": "input"},
            output_data={"test": "output"},
            execution_time_ms=100,
            prompt_tokens=50,
            completion_tokens=25,
            latency_ms=150,
            status="success",
        )

        assert log.id is not None
        assert log.agent_name == "TestAgent"
        assert log.status == "success"

    @pytest.mark.asyncio
    async def test_log_error(self, db_session: AsyncSession):
        """Test logging failed agent execution."""
        service = AgentLogService(db_session)

        log = await service.log_error(
            session_id="test_session",
            user_id="test_user",
            interview_id="test_interview",
            agent_name="TestAgent",
            node_name="test_node",
            error="Something went wrong",
            input_data={"test": "input"},
        )

        assert log.id is not None
        assert log.status == "failed"
        assert log.error_message == "Something went wrong"


class TestInterviewStateService:
    """Tests for InterviewStateService."""

    @pytest.mark.asyncio
    async def test_create_state(self, db_session: AsyncSession):
        """Test creating interview state."""
        service = InterviewStateService(db_session)

        state = await service.create_state(
            session_id="test_session_001",
            user_id="test_user",
            interview_id="test_interview",
            resume_summary={"skills": ["Python"]},
            jd_summary={"role": "Engineer"},
        )

        assert state.session_id == "test_session_001"
        assert state.current_state == "initialized"

    @pytest.mark.asyncio
    async def test_get_state(self, db_session: AsyncSession):
        """Test getting interview state."""
        service = InterviewStateService(db_session)

        await service.create_state(
            session_id="test_session_002",
            user_id="test_user",
            interview_id="test_interview",
            resume_summary={"skills": ["Python"]},
            jd_summary={"role": "Engineer"},
        )

        state = await service.get_state("test_session_002")
        assert state is not None
        assert state.session_id == "test_session_002"

    @pytest.mark.asyncio
    async def test_add_question_to_history(self, db_session: AsyncSession):
        """Test adding question to history."""
        service = InterviewStateService(db_session)

        created = await service.create_state(
            session_id="test_session_003",
            user_id="test_user",
            interview_id="test_interview",
            resume_summary={"skills": ["Python"]},
            jd_summary={"role": "Engineer"},
        )

        updated = await service.add_question_to_history(
            session_id="test_session_003",
            question="What is Python?",
            question_type="technical",
        )

        assert updated is not None
        assert updated.current_question == "What is Python?"
        assert "What is Python?" in updated.previous_questions

    @pytest.mark.asyncio
    async def test_advance_state(self, db_session: AsyncSession):
        """Test advancing interview state."""
        service = InterviewStateService(db_session)

        await service.create_state(
            session_id="test_session_004",
            user_id="test_user",
            interview_id="test_interview",
            resume_summary={"skills": ["Python"]},
            jd_summary={"role": "Engineer"},
        )

        advanced = await service.advance_state("test_session_004", "questioning")
        assert advanced is not None
        assert advanced.current_state == "questioning"


class TestAIService:
    """Tests for AIService."""

    @pytest.mark.asyncio
    async def test_ai_service_initialization(self, db_session: AsyncSession):
        """Test AIService initialization."""
        mock_client = MagicMock()
        service = AIService(session=db_session, openai_client=mock_client)

        assert service.session is not None
        assert service.openai_client == mock_client

    @pytest.mark.asyncio
    async def test_save_and_get_state(self, db_session: AsyncSession):
        """Test saving and retrieving state."""
        from schemas.ai import SaveStateRequest

        mock_client = MagicMock()
        service = AIService(session=db_session, openai_client=mock_client)

        save_request = SaveStateRequest(
            session_id="test_state_session",
            user_id="test_user",
            interview_id="test_interview",
            resume_summary={"skills": ["Python", "FastAPI"]},
            jd_summary={"role": "Backend Engineer", "required_skills": ["Python"]},
            difficulty_level="medium",
            conversation_history=[],
            previous_questions=[],
            skill_scores={"Python": 8.0},
        )

        saved = await service.save_state(save_request)
        assert saved is not None

        retrieved = await service.get_state("test_state_session")
        assert retrieved is not None
        assert retrieved.session_id == "test_state_session"
        assert retrieved.resume_summary == {"skills": ["Python", "FastAPI"]}
