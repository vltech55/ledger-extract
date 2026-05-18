from __future__ import annotations

import os

os.environ.setdefault("ANTHROPIC_API_KEY", "test")
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://extract:extract@localhost:5435/extract_test")
os.environ.setdefault(
    "DATABASE_URL_SYNC", "postgresql+psycopg://extract:extract@localhost:5435/extract_test"
)
os.environ.setdefault("CELERY_BROKER_URL", "memory://")
os.environ.setdefault("CELERY_RESULT_BACKEND", "cache+memory://")
