"""Logging configuration using Loguru."""

import sys
from datetime import datetime
from typing import Any

from loguru import logger

from config.settings import get_settings

settings = get_settings()


def serialize_log(obj: Any) -> str:
    """Serialize log objects to JSON string."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    return str(obj)


def configure_logging() -> None:
    """Configure Loguru logger with JSON format for production."""
    logger.remove()
    logger.configure(extra={"request_id": "", "user_id": "", "interview_id": ""})

    log_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
        "{extra[request_id]} | "
        "{extra[user_id]} | "
        "{extra[interview_id]} | "
        "{message}"
    )

    if settings.log_format == "json":
        logger.add(
            sys.stdout,
            format="{message}",
            level=settings.log_level,
            serialize=True,
        )
    else:
        logger.add(
            sys.stdout,
            format=log_format,
            level=settings.log_level,
            colorize=True,
        )

    logger.add(
        "logs/app_{time:YYYY-MM-DD}.log",
        rotation="00:00",
        retention="30 days",
        level=settings.log_level,
        format=log_format,
        serialize=False,
    )

    logger.add(
        "logs/error_{time:YYYY-MM-DD}.log",
        rotation="00:00",
        retention="90 days",
        level="ERROR",
        format=log_format,
        serialize=False,
    )


def get_logger(name: str) -> logger:
    """Get a logger instance with the specified name."""
    return logger.bind(name=name)
