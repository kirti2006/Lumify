"""Common schemas used across the application."""

from datetime import datetime
from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """Standard API response format."""

    success: bool = Field(default=True, description="Indicates if the request was successful")
    message: str = Field(default="", description="Response message")
    data: Optional[T] = Field(default=None, description="Response data payload")
    errors: Optional[list[str]] = Field(default=None, description="List of errors if any")
    meta: Optional[dict[str, Any]] = Field(default=None, description="Metadata")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Operation completed successfully",
                "data": {},
                "errors": None,
                "meta": {"timestamp": "2024-01-01T00:00:00Z"},
            }
        }


class HealthResponse(BaseModel):
    """Health check response schema."""

    status: str = Field(default="healthy", description="Service health status")
    version: str = Field(..., description="Application version")
    service: str = Field(..., description="Service name")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Check timestamp")
    dependencies: dict[str, str] = Field(
        default_factory=dict, description="Status of service dependencies"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "version": "1.0.0",
                "service": "Lumify AI Microservice MS-2",
                "timestamp": "2024-01-01T00:00:00Z",
                "dependencies": {
                    "database": "healthy",
                    "redis": "healthy",
                },
            }
        }


class TokenUsage(BaseModel):
    """Token usage tracking schema."""

    prompt_tokens: int = Field(default=0, description="Number of prompt tokens used")
    completion_tokens: int = Field(default=0, description="Number of completion tokens used")
    total_tokens: int = Field(default=0, description="Total tokens used")
    latency_ms: int = Field(default=0, description="Request latency in milliseconds")


class ErrorDetail(BaseModel):
    """Error detail schema."""

    field: Optional[str] = Field(default=None, description="Field that caused the error")
    message: str = Field(..., description="Error message")
    code: str = Field(default="validation_error", description="Error code")


class PaginationParams(BaseModel):
    """Pagination parameters schema."""

    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")
    sort_by: Optional[str] = Field(default=None, description="Field to sort by")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$", description="Sort order")
