"""Error handler middleware."""

import traceback
from typing import Union

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from config.logging import get_logger

logger = get_logger(__name__)


class AIError(Exception):
    """Base AI service error."""

    def __init__(self, message: str, code: str = "ai_error", details: dict = None):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)


class LLMError(AIError):
    """LLM-related errors."""

    def __init__(self, message: str, details: dict = None):
        super().__init__(message, code="llm_error", details=details)


class ValidationAIError(AIError):
    """Validation errors."""

    def __init__(self, message: str, details: dict = None):
        super().__init__(message, code="validation_error", details=details)


class DatabaseError(AIError):
    """Database operation errors."""

    def __init__(self, message: str, details: dict = None):
        super().__init__(message, code="database_error", details=details)


class RateLimitError(AIError):
    """Rate limit exceeded errors."""

    def __init__(self, message: str, details: dict = None):
        super().__init__(message, code="rate_limit_error", details=details)


async def global_exception_handler(request: Request, exc: Union[Exception, AIError]) -> JSONResponse:
    """Global exception handler for all unhandled exceptions."""
    request_id = request.headers.get("X-Request-ID", "unknown")

    if isinstance(exc, AIError):
        safe_msg = str(exc.message).replace("{", "{{").replace("}", "}}")
        logger.error(f"AI Error: {safe_msg}", extra={"request_id": request_id, "code": exc.code})
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"success": False, "message": exc.message, "errors": [exc.code]},
        )

    if isinstance(exc, RequestValidationError):
        errors = []
        for error in exc.errors():
            errors.append({"field": ".".join(str(loc) for loc in error["loc"]), "message": error["msg"]})
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"success": False, "message": "Validation error", "errors": errors},
        )

    if isinstance(exc, StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "message": exc.detail},
        )

    safe_exc = str(exc).replace("{", "{{").replace("}", "}}")
    logger.error(f"Unhandled exception: {safe_exc}", extra={"traceback": traceback.format_exc()})
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "message": "Internal server error"},
    )


def setup_exception_handlers(app: FastAPI) -> None:
    """Register all exception handlers with the FastAPI app."""
    app.add_exception_handler(AIError, global_exception_handler)
    app.add_exception_handler(RequestValidationError, global_exception_handler)
    app.add_exception_handler(StarletteHTTPException, global_exception_handler)
    app.add_exception_handler(Exception, global_exception_handler)
