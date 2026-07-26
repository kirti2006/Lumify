"""AI Service - Main service for AI operations."""

import time
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from config.logging import get_logger
from config.settings import get_settings
from graph.interview_workflow import InterviewWorkflow
from llm.llm_client import LLMClient, get_llm_client
from repositories.agent_log_repository import AIAgentLogRepository
from repositories.ai_evaluation_repository import AIEvaluationRepository
from repositories.interview_state_repository import InterviewStateRepository
from schemas.ai import (
    EvaluateAnswerRequest,
    EvaluateAnswerResponse,
    EvaluationData,
    EvaluationScores,
    GenerateFeedbackRequest,
    GenerateFeedbackResponse,
    GenerateQuestionRequest,
    GenerateQuestionResponse,
    GenerateQuestionsResponse,
    OverallFeedback,
    QuestionData,
    RecommendResourcesRequest,
    RecommendResourcesResponse,
    ResourceItem,
)
from services.agent_log_service import AgentLogService

settings = get_settings()
logger = get_logger(__name__)


class AIService:
    """Main service for AI-related operations."""

    def __init__(
        self,
        session: AsyncSession,
        llm_client: Optional[LLMClient] = None,
    ):
        self.session = session
        self.llm_client = llm_client or get_llm_client(provider=settings.llm_provider)
        self.evaluation_repo = AIEvaluationRepository(session)
        self.agent_log_repo = AIAgentLogRepository(session)
        self.state_repo = InterviewStateRepository(session)
        self.agent_log_service = AgentLogService(session)

    async def generate_question(
        self,
        request: GenerateQuestionRequest,
    ) -> GenerateQuestionResponse:
        """Generate an interview question using LangGraph workflow."""
        start_time = time.time()

        try:
            workflow = InterviewWorkflow(
                llm_client=self.llm_client,
                session_id=request.session_id,
                user_id=request.user_id,
                interview_id=request.interview_id,
            )

            input_data = {
                "jd_summary": request.jd_summary,
                "question_type": request.question_type,
                "difficulty": request.difficulty,
                "previous_questions": request.previous_questions or [],
                "conversation_history": request.conversation_history or [],
            }

            result = await workflow.run(input_data)

            execution_time = int((time.time() - start_time) * 1000)

            question_data = QuestionData(
                question=result.get("question", ""),
                question_type=result.get("question_type", request.question_type or "behavioral"),
                difficulty=result.get("difficulty", request.difficulty or "medium"),
                expected_skills=result.get("expected_skills", []),
                tips=result.get("tips"),
            )

            logger.info(
                "Question generated successfully",
                extra={
                    "session_id": request.session_id,
                    "execution_time_ms": execution_time,
                },
            )

            return GenerateQuestionResponse(
                session_id=request.session_id,
                question=question_data,
                follow_up_prompt=result.get("follow_up_prompt"),
                token_usage=result.get("token_usage", {}),
            )

        except Exception as e:
            safe_err = str(e).replace("{", "{{").replace("}", "}}")
            logger.error(f"Error generating question: {safe_err}", extra={"session_id": request.session_id})
            await self.agent_log_service.log_error(
                session_id=request.session_id,
                user_id=request.user_id,
                error=safe_err,
                context={"node": "generate_question"},
            )
            raise

    async def generate_questions(
        self,
        request: GenerateQuestionRequest,
    ) -> GenerateQuestionsResponse:
        """Generate a batch of 5 interview questions."""
        start_time = time.time()
        try:
            from pydantic import BaseModel
            class QuestionsBatch(BaseModel):
                questions: list[QuestionData]

            role = request.jd_summary.get("role") or "the target role"
            focus = request.jd_summary.get("interview_focus") or request.question_type or "technical"
            level = request.jd_summary.get("experience_level") or request.difficulty or "medium"
            raw_jd = request.jd_summary.get("raw_text") or ""
            required_skills = request.jd_summary.get("required_skills", [])
            candidate_skills = []
            count = request.count or 5

            prompt = f"""Generate exactly {count} interview questions for this candidate's selected target role.

Target role: {role}
Interview focus: {focus}
Experience level: {level}
Company/JD context: {raw_jd}
Required skills: {', '.join(required_skills) if required_skills else 'Infer from target role and JD context'}
Candidate experience: Unknown years
Candidate skills: {', '.join(candidate_skills) if candidate_skills else 'Not provided'}

CRITICAL INSTRUCTIONS:
- You MUST generate EXACTLY {count} questions. No more, no less.
- The questions MUST match the selected experience level: "{level}". If entry-level/fresher, keep questions foundational and accessible. If senior, make them complex system-design or architectural level. Do not give extreme hard questions to entry-level candidates.
- Every question must be directly relevant to "{role}" and the focus "{focus}".
- Avoid duplicate, repetitive, or generic questions.
"""
            result, token_info = await self.llm_client.generate_structured(
                prompt=prompt,
                response_model=QuestionsBatch,
                system_prompt="You are an expert role-specific interviewer. Follow the candidate's selected role, focus, and experience level strictly. You must output exactly the requested number of questions.",
            )

            questions = result.questions[:count]

            execution_time = int((time.time() - start_time) * 1000)
            return GenerateQuestionsResponse(
                session_id=request.session_id,
                questions=questions,
                token_usage={"total_tokens": token_info.prompt_tokens + token_info.completion_tokens},
            )
        except Exception as e:
            logger.error(f"Error generating questions: {e}")
            await self.agent_log_service.log_error(
                session_id=request.session_id,
                user_id=request.user_id,
                interview_id=request.interview_id,
                agent_name="QuestionGenerator",
                node_name="generate_questions",
                error=str(e),
            )
            raise

    async def evaluate_answer(
        self,
        request: EvaluateAnswerRequest,
    ) -> EvaluateAnswerResponse:
        """Evaluate a candidate's answer using LangGraph workflow."""
        start_time = time.time()

        try:
            workflow = InterviewWorkflow(
                llm_client=self.llm_client,
                session_id=request.session_id,
                user_id=request.user_id,
                interview_id=request.interview_id,
            )

            input_data = {
                "question": request.question,
                "question_type": request.question_type,
                "difficulty": request.difficulty,
                "answer": request.answer,
                "conversation_history": request.conversation_history or [],
            }

            result = await workflow.evaluate_answer(input_data)

            execution_time = int((time.time() - start_time) * 1000)

            scores = EvaluationScores(
                correctness=result.get("correctness_score", 0.0),
                communication=result.get("communication_score", 0.0),
                confidence=result.get("confidence_score", 0.0),
                technical_accuracy=result.get("technical_accuracy_score", 0.0),
                star_format=result.get("star_format_score", 0.0),
                depth=result.get("depth_score", 0.0),
                overall=result.get("overall_score", 0.0),
            )

            evaluation_data = EvaluationData(
                scores=scores,
                strengths=result.get("strengths", []),
                weaknesses=result.get("weaknesses", []),
                improvement_suggestions=result.get("improvement_suggestions", []),
                emotion_score=result.get("emotion_score"),
                follow_up_question=result.get("follow_up_question"),
            )

            # The evaluation is saved by MS1 which owns the ai_evaluations schema.
            # We don't save it in MS2 to avoid schema conflicts.

            logger.info(
                "Answer evaluated successfully",
                extra={
                    "session_id": request.session_id,
                    "overall_score": scores.overall,
                    "execution_time_ms": execution_time,
                },
            )

            return EvaluateAnswerResponse(
                session_id=request.session_id,
                evaluation=evaluation_data,
                token_usage=result.get("token_usage", {}),
            )

        except Exception as e:
            safe_err = str(e).replace("{", "{{").replace("}", "}}")
            logger.error(f"Error evaluating answer: {safe_err}", extra={"session_id": request.session_id})
            await self.agent_log_service.log_error(
                session_id=request.session_id,
                user_id=request.user_id,
                interview_id=request.interview_id,
                agent_name="AnswerEvaluator",
                node_name="evaluate_answer",
                error=str(e),
            )
            raise

    async def generate_feedback(
        self,
        request: GenerateFeedbackRequest,
    ) -> GenerateFeedbackResponse:
        """Generate comprehensive feedback for the interview."""
        start_time = time.time()

        try:
            workflow = InterviewWorkflow(
                llm_client=self.llm_client,
                session_id=request.session_id,
                user_id=request.user_id,
                interview_id=request.interview_id,
            )

            input_data = {
                "all_questions": request.all_questions,
                "all_answers": request.all_answers,
                "all_evaluations": [e for e in request.all_evaluations],
                "skill_scores": request.skill_scores,
            }

            result = await workflow.generate_feedback(input_data)

            execution_time = int((time.time() - start_time) * 1000)

            prioritized_improvements = [
                {"skill": imp.get("skill", ""), "reason": imp.get("reason", "")}
                for imp in result.get("prioritized_improvements", [])
            ]

            feedback = OverallFeedback(
                performance_summary=result.get("performance_summary", ""),
                overall_score=result.get("overall_score", 0.0),
                strong_areas=result.get("strong_areas", []),
                areas_for_improvement=result.get("areas_for_improvement", []),
                key_strengths=result.get("key_strengths", []),
                prioritized_improvements=prioritized_improvements,
                next_steps=result.get("next_steps", []),
                estimated_preparation_time=result.get("estimated_preparation_time"),
            )

            logger.info(
                "Feedback generated successfully",
                extra={
                    "session_id": request.session_id,
                    "overall_score": feedback.overall_score,
                    "execution_time_ms": execution_time,
                },
            )

            return GenerateFeedbackResponse(
                session_id=request.session_id,
                feedback=feedback,
                token_usage=result.get("token_usage", {}),
            )

        except Exception as e:
            safe_err = str(e).replace("{", "{{").replace("}", "}}")
            logger.error(f"Error generating feedback: {safe_err}", extra={"session_id": request.session_id})
            raise

    async def recommend_resources(
        self,
        request: RecommendResourcesRequest,
    ) -> RecommendResourcesResponse:
        """Recommend learning resources based on skill gaps."""
        start_time = time.time()

        try:
            workflow = InterviewWorkflow(
                llm_client=self.llm_client,
                session_id=request.session_id,
                user_id=request.user_id,
                interview_id=request.interview_id,
            )

            input_data = {
                "skill_gaps": request.skill_gaps,
                "current_levels": request.current_level or {},
                "preferred_formats": request.preferred_format,
                "time_constraint_minutes": request.time_constraint_minutes,
                "difficulty_preference": request.difficulty_preference,
            }

            result = await workflow.recommend_resources(input_data)

            execution_time = int((time.time() - start_time) * 1000)

            resources = [
                ResourceItem(
                    title=r.get("title", ""),
                    description=r.get("description"),
                    url=r.get("url", ""),
                    type=r.get("type", ""),
                    skill=r.get("skill", ""),
                    difficulty=r.get("difficulty", ""),
                    provider=r.get("provider"),
                    duration_minutes=r.get("duration_minutes"),
                    is_free=r.get("is_free", True),
                    relevance_score=r.get("relevance_score", 0.5),
                )
                for r in result.get("resources", [])
            ]

            logger.info(
                "Resources recommended successfully",
                extra={
                    "session_id": request.session_id,
                    "resource_count": len(resources),
                    "execution_time_ms": execution_time,
                },
            )

            return RecommendResourcesResponse(
                session_id=request.session_id,
                resources=resources,
                total_count=len(resources),
                token_usage=result.get("token_usage", {}),
            )

        except Exception as e:
            safe_err = str(e).replace("{", "{{").replace("}", "}}")
            logger.error(f"Error recommending resources: {safe_err}", extra={"session_id": request.session_id})
            raise

    async def save_state(
        self,
        request,
    ):
        """Save interview state to database."""

        existing_state = await self.state_repo.get_by_session_id(request.session_id)

        if existing_state:
            if request.jd_summary is not None:
                existing_state.jd_summary = request.jd_summary
            if request.current_question is not None:
                existing_state.current_question = request.current_question
            if request.current_question_type is not None:
                existing_state.current_question_type = request.current_question_type
            if request.difficulty_level is not None:
                existing_state.difficulty_level = request.difficulty_level
            if request.conversation_history is not None:
                existing_state.conversation_history = request.conversation_history
            if request.previous_questions is not None:
                existing_state.previous_questions = request.previous_questions
            if request.skill_scores is not None:
                existing_state.skill_scores = request.skill_scores
            if request.evaluation_summary is not None:
                existing_state.evaluation_summary = request.evaluation_summary
            if request.feedback_summary is not None:
                existing_state.feedback_summary = request.feedback_summary
            if request.emotion_score is not None:
                existing_state.current_emotion_score = request.emotion_score
            if request.metadata is not None:
                existing_state.metadata = request.metadata

            updated_state = await self.state_repo.update(existing_state)
            return updated_state
        else:
            from models.interview_state import InterviewState

            new_state = InterviewState(
                session_id=request.session_id,
                user_id=request.user_id,
                interview_id=request.interview_id,
                jd_summary=request.jd_summary or {},
                current_question=request.current_question,
                current_question_type=request.current_question_type,
                difficulty_level=request.difficulty_level or "medium",
                conversation_history=request.conversation_history or [],
                previous_questions=request.previous_questions or [],
                skill_scores=request.skill_scores or {},
                evaluation_summary=request.evaluation_summary,
                feedback_summary=request.feedback_summary,
                current_emotion_score=request.emotion_score,
                metadata=request.metadata,
                current_state="initialized",
            )
            created_state = await self.state_repo.create(new_state)
            return created_state

    async def get_state(self, session_id: str):
        """Get interview state from database."""
        state = await self.state_repo.get_by_session_id(session_id)
        return state
