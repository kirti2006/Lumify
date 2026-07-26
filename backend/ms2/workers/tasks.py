"""Celery tasks for background processing."""

from celery import shared_task

from config.logging import get_logger

logger = get_logger(__name__)


@shared_task(bind=True, max_retries=3)
def cleanup_old_logs_task(self):
    """Periodic task to cleanup old agent logs."""
    try:
        logger.info("Starting cleanup of old agent logs")
        from config.database import async_session_factory
        from repositories.agent_log_repository import AIAgentLogRepository

        async def _cleanup():
            async with async_session_factory() as session:
                repo = AIAgentLogRepository(session)
                deleted_count = await repo.delete_old_logs(days=30)
                await session.commit()
                return deleted_count

        import asyncio
        deleted = asyncio.run(_cleanup())
        logger.info(f"Cleanup completed, deleted {deleted} old logs")
        return {"deleted_count": deleted}

    except Exception as e:
        logger.error(f"Cleanup task failed: {e}")
        raise self.retry(exc=e, countdown=60)


@shared_task(bind=True, max_retries=3)
def cleanup_stale_states_task(self):
    """Periodic task to cleanup stale interview states."""
    try:
        logger.info("Starting cleanup of stale interview states")
        from config.database import async_session_factory
        from repositories.interview_state_repository import InterviewStateRepository

        async def _cleanup():
            async with async_session_factory() as session:
                repo = InterviewStateRepository(session)
                cleaned = await repo.cleanup_stale_states(hours=24)
                await session.commit()
                return cleaned

        import asyncio
        cleaned = asyncio.run(_cleanup())
        logger.info(f"Stale states cleanup completed, cleaned {cleaned} states")
        return {"cleaned_count": cleaned}

    except Exception as e:
        logger.error(f"Stale states cleanup failed: {e}")
        raise self.retry(exc=e, countdown=60)


@shared_task
def log_agent_execution(
    session_id: str,
    user_id: str,
    interview_id: str,
    agent_name: str,
    node_name: str,
    input_data: dict,
    output_data: dict,
    execution_time_ms: int,
):
    """Log agent execution to database."""
    try:
        from config.database import async_session_factory
        from models.ai_agent_log import AIAgentLog

        async def _log():
            async with async_session_factory() as session:
                log_entry = AIAgentLog(
                    session_id=session_id,
                    user_id=user_id,
                    interview_id=interview_id,
                    agent_name=agent_name,
                    node_name=node_name,
                    input_data=input_data,
                    output_data=output_data,
                    execution_time_ms=execution_time_ms,
                    prompt_tokens=input_data.get("prompt_tokens", 0),
                    completion_tokens=output_data.get("completion_tokens", 0),
                    total_tokens=input_data.get("prompt_tokens", 0) + output_data.get("completion_tokens", 0),
                    latency_ms=execution_time_ms,
                    status="success",
                )
                session.add(log_entry)
                await session.commit()

        import asyncio
        asyncio.run(_log())
        logger.info(f"Agent execution logged: {agent_name}")

    except Exception as e:
        logger.error(f"Failed to log agent execution: {e}")
