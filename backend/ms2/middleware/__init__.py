"""Middleware module for FastAPI middleware."""

from middleware.error_handler import (
    global_exception_handler,
    setup_exception_handlers,
)

__all__ = ["global_exception_handler", "setup_exception_handlers"]
