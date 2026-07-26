"""Pydantic schemas for request/response validation."""

from schemas.ai import (
    EvaluateAnswerRequest,
    EvaluateAnswerResponse,
    GenerateFeedbackRequest,
    GenerateFeedbackResponse,
    GenerateQuestionRequest,
    GenerateQuestionResponse,
    GetStateResponse,
    RecommendResourcesRequest,
    RecommendResourcesResponse,
    SaveStateRequest,
    SaveStateResponse,
)
from schemas.common import APIResponse, HealthResponse

__all__ = [
    "GenerateQuestionRequest",
    "GenerateQuestionResponse",
    "EvaluateAnswerRequest",
    "EvaluateAnswerResponse",
    "GenerateFeedbackRequest",
    "GenerateFeedbackResponse",
    "RecommendResourcesRequest",
    "RecommendResourcesResponse",
    "SaveStateRequest",
    "SaveStateResponse",
    "GetStateResponse",
    "APIResponse",
    "HealthResponse",
]
