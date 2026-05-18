from __future__ import annotations

from celery import Celery

from extraction.core.config import settings
from extraction.core.logging import configure_logging

configure_logging()

celery_app = Celery(
    "extraction",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_expires=3600,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_default_retry_delay=10,
    task_max_retries=3,
)

# Force task registration on worker boot.
import extraction.tasks.extract  # noqa: E402, F401
