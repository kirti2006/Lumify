"""Celery application configuration."""

from celery import Celery

from config.settings import get_settings

settings = get_settings()

celery_app = Celery(
    "lumify_ms2",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_hijack_root_logger=False,
    beat_schedule={
        "cleanup-old-logs": {
            "task": "workers.tasks.cleanup_old_logs_task",
            "schedule": 86400,  # 24 hours
        },
        "cleanup-stale-states": {
            "task": "workers.tasks.cleanup_stale_states_task",
            "schedule": 3600,  # 1 hour
        },
    },
)
