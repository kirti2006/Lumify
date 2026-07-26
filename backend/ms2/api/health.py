"""Health check routes."""

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db_session
from config.settings import get_settings
from schemas.common import HealthResponse

settings = get_settings()
router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health Check",
    description="Check the health of the AI microservice",
)
async def health_check(
    session: AsyncSession = Depends(get_db_session),
):
    """Check health of the service and its dependencies."""
    db_status = "unhealthy"
    redis_status = "unhealthy"
    dependencies = {}

    try:
        await session.execute(text("SELECT 1"))
        db_status = "healthy"
        dependencies["database"] = db_status
    except Exception:
        dependencies["database"] = db_status

    try:
        from config.redis import get_redis
        redis_client = await get_redis().__anext__()
        await redis_client.ping()
        redis_status = "healthy"
        dependencies["redis"] = redis_status
    except Exception:
        dependencies["redis"] = redis_status

    overall_status = "healthy" if db_status == "healthy" and redis_status == "healthy" else "degraded"

    return HealthResponse(
        status=overall_status,
        version=settings.app_version,
        service=settings.app_name,
        timestamp=datetime.utcnow(),
        dependencies=dependencies,
    )
