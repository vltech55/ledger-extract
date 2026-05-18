from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    anthropic_api_key: str = Field(default="")
    anthropic_model: str = Field(default="claude-sonnet-4-6")
    prompt_version: str = Field(default="v2")

    database_url: str = Field(default="postgresql+asyncpg://extract:extract@postgres:5432/extract")
    database_url_sync: str = Field(default="postgresql+psycopg://extract:extract@postgres:5432/extract")

    redis_url: str = Field(default="redis://redis:6379/0")
    celery_broker_url: str = Field(default="redis://redis:6379/0")
    celery_result_backend: str = Field(default="redis://redis:6379/1")

    upload_dir: str = Field(default="/app/data/uploads")
    samples_dir: str = Field(default="/app/data/samples")
    max_upload_mb: int = Field(default=20, ge=1, le=100)

    confidence_auto_approve: float = Field(default=0.85, ge=0.0, le=1.0)
    confidence_review_floor: float = Field(default=0.0, ge=0.0, le=1.0)

    api_host: str = Field(default="0.0.0.0")
    api_port: int = Field(default=8000)
    cors_origins: str = Field(default="http://localhost:3000,http://localhost:3001")
    log_level: str = Field(default="INFO")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
