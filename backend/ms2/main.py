"""FastAPI application entry point for MS-2 AI Microservice."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.health import router as health_router
from api.routes import ai_router
from config.database import close_db, init_db
from config.logging import configure_logging, get_logger
from config.redis import close_redis, init_redis
from config.settings import get_settings
from middleware.error_handler import setup_exception_handlers

settings = get_settings()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Application lifespan manager."""
    configure_logging()
    logger.info("Starting Lumify AI Microservice MS-2")

    await init_db()
    logger.info("Database initialized")

    await init_redis()
    logger.info("Redis initialized")

    yield

    await close_redis()
    logger.info("Redis connection closed")

    await close_db()
    logger.info("Database connection closed")

    logger.info("Lumify AI Microservice MS-2 shutdown complete")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        description="AI Microservice for interview preparation - Question Generation, Answer Evaluation, Feedback, and Learning Recommendations",
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=settings.cors_allow_methods,
        allow_headers=settings.cors_allow_headers,
    )

    setup_exception_handlers(app)

    app.include_router(health_router)
    app.include_router(ai_router)

    @app.get("/", tags=["Root"])
    async def root():
        """Root endpoint."""
        return {
            "service": settings.app_name,
            "version": settings.app_version,
            "status": "running",
        }

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )
