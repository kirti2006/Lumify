"""API routes for AI endpoints."""

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db_session
from config.settings import get_settings
from dependencies.auth import verify_request
from middleware.error_handler import AIError
from schemas.ai import (
    EvaluateAnswerRequest,
    EvaluateAnswerResponse,
    GenerateFeedbackRequest,
    GenerateFeedbackResponse,
    GenerateQuestionRequest,
    GenerateQuestionResponse,
    GenerateQuestionsResponse,
    GetStateResponse,
    RecommendResourcesRequest,
    RecommendResourcesResponse,
    SaveStateRequest,
    SaveStateResponse,
)
from schemas.common import APIResponse
from services.ai_service import AIService

settings = get_settings()

ai_router = APIRouter(prefix="/api/v1/ai", tags=["AI"])


async def get_ai_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AIService:
    """Get AI service instance."""
    return AIService(session)


@ai_router.post(
    "/generate-question",
    response_model=APIResponse[GenerateQuestionResponse],
    summary="Generate Interview Question",
    description="Generate an interview question based on resume and job description",
)
async def generate_question(
    request: Request,
    body: GenerateQuestionRequest,
    auth: Annotated[dict, Depends(verify_request)],
    service: Annotated[AIService, Depends(get_ai_service)],
):
    """Generate an interview question."""
    try:
        result = await service.generate_question(body)
        return APIResponse(
            success=True,
            message="Question generated successfully",
            data=result.model_dump(),
            meta={
                "timestamp": datetime.utcnow().isoformat(),
                "request_id": request.headers.get("X-Request-ID"),
            },
        )
    except Exception as e:
        raise AIError(f"Failed to generate question: {str(e)}", details={"question_type": body.question_type})


@ai_router.post(
    "/generate-questions",
    response_model=APIResponse[GenerateQuestionsResponse],
    summary="Batch Generate Interview Questions",
    description="Generate a batch of 5 interview questions based on resume and job description",
)
async def generate_questions(
    request: Request,
    body: GenerateQuestionRequest,
    auth: Annotated[dict, Depends(verify_request)],
    service: Annotated[AIService, Depends(get_ai_service)],
):
    """Generate a batch of interview questions."""
    try:
        result = await service.generate_questions(body)
        return APIResponse(
            success=True,
            message="Questions generated successfully",
            data=result.model_dump(),
            meta={
                "timestamp": datetime.utcnow().isoformat(),
                "request_id": request.headers.get("X-Request-ID"),
            },
        )
    except Exception as e:
        raise AIError(f"Failed to generate questions: {str(e)}")


@ai_router.post(
    "/evaluate-answer",
    response_model=APIResponse[EvaluateAnswerResponse],
    summary="Evaluate Interview Answer",
    description="Evaluate a candidate's answer to an interview question",
)
async def evaluate_answer(
    request: Request,
    body: EvaluateAnswerRequest,
    auth: Annotated[dict, Depends(verify_request)],
    service: Annotated[AIService, Depends(get_ai_service)],
):
    """Evaluate a candidate's answer."""
    try:
        result = await service.evaluate_answer(body)
        return APIResponse(
            success=True,
            message="Answer evaluated successfully",
            data=result.model_dump(),
            meta={
                "timestamp": datetime.utcnow().isoformat(),
                "request_id": request.headers.get("X-Request-ID"),
            },
        )
    except Exception as e:
        raise AIError(f"Failed to evaluate answer: {str(e)}")


@ai_router.post(
    "/generate-feedback",
    response_model=APIResponse[GenerateFeedbackResponse],
    summary="Generate Interview Feedback",
    description="Generate comprehensive feedback for the entire interview",
)
async def generate_feedback(
    request: Request,
    body: GenerateFeedbackRequest,
    auth: Annotated[dict, Depends(verify_request)],
    service: Annotated[AIService, Depends(get_ai_service)],
):
    """Generate comprehensive feedback."""
    try:
        result = await service.generate_feedback(body)
        return APIResponse(
            success=True,
            message="Feedback generated successfully",
            data=result.model_dump(),
            meta={
                "timestamp": datetime.utcnow().isoformat(),
                "request_id": request.headers.get("X-Request-ID"),
            },
        )
    except Exception as e:
        raise AIError(f"Failed to generate feedback: {str(e)}")


@ai_router.post(
    "/recommend-resources",
    response_model=APIResponse[RecommendResourcesResponse],
    summary="Recommend Learning Resources",
    description="Recommend learning resources based on skill gaps",
)
async def recommend_resources(
    request: Request,
    body: RecommendResourcesRequest,
    auth: Annotated[dict, Depends(verify_request)],
    service: Annotated[AIService, Depends(get_ai_service)],
):
    """Recommend learning resources."""
    try:
        result = await service.recommend_resources(body)
        return APIResponse(
            success=True,
            message="Resources recommended successfully",
            data=result.model_dump(),
            meta={
                "timestamp": datetime.utcnow().isoformat(),
                "request_id": request.headers.get("X-Request-ID"),
            },
        )
    except Exception as e:
        raise AIError(f"Failed to recommend resources: {str(e)}")


@ai_router.post(
    "/save-state",
    response_model=APIResponse[SaveStateResponse],
    summary="Save Interview State",
    description="Save the current interview state to database",
)
async def save_state(
    request: Request,
    body: SaveStateRequest,
    auth: Annotated[dict, Depends(verify_request)],
    service: Annotated[AIService, Depends(get_ai_service)],
):
    """Save interview state."""
    try:
        result = await service.save_state(body)
        return APIResponse(
            success=True,
            message="State saved successfully",
            data={
                "session_id": result.session_id,
                "saved": True,
                "timestamp": result.updated_at.isoformat() if result.updated_at else datetime.utcnow().isoformat(),
                "message": "State saved successfully",
            },
            meta={
                "timestamp": datetime.utcnow().isoformat(),
                "request_id": request.headers.get("X-Request-ID"),
            },
        )
    except Exception as e:
        raise AIError(f"Failed to save state: {str(e)}")


@ai_router.get(
    "/state/{session_id}",
    response_model=APIResponse[GetStateResponse],
    summary="Get Interview State",
    description="Retrieve the current interview state by session ID",
)
async def get_state(
    request: Request,
    session_id: str,
    auth: Annotated[dict, Depends(verify_request)],
    service: Annotated[AIService, Depends(get_ai_service)],
):
    """Get interview state by session ID."""
    try:
        result = await service.get_state(session_id)
        if not result:
            return APIResponse(
                success=True,
                message="State not found",
                data=None,
                meta={"timestamp": datetime.utcnow().isoformat()},
            )

        return APIResponse(
            success=True,
            message="State retrieved successfully",
            data={
                "session_id": result.session_id,
                "user_id": result.user_id,
                "interview_id": result.interview_id,
                "jd_summary": result.jd_summary,
                "current_question": result.current_question,
                "current_question_type": result.current_question_type,
                "difficulty_level": result.difficulty_level,
                "conversation_history": result.conversation_history,
                "previous_questions": result.previous_questions,
                "skill_scores": result.skill_scores,
                "total_questions": result.total_questions_asked,
                "total_evaluations": result.total_evaluations,
                "current_state": result.current_state,
                "last_activity_at": result.last_activity_at.isoformat() if result.last_activity_at else None,
            },
            meta={
                "timestamp": datetime.utcnow().isoformat(),
                "request_id": request.headers.get("X-Request-ID"),
            },
        )
    except Exception as e:
        raise AIError(f"Failed to get state: {str(e)}")
