from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class DocumentOut(BaseModel):
    id: UUID
    filename: str
    status: str
    failure_reason: str | None
    page_count: int | None
    byte_size: int
    uploaded_at: datetime
    extraction_id: UUID | None = None
    extraction_status: str | None = None
    min_confidence: float | None = None


class ExtractionOut(BaseModel):
    id: UUID
    document_id: UUID
    document_filename: str
    prompt_version: str
    model: str
    fields: dict
    min_confidence: float
    mean_confidence: float
    heuristic_signals: dict
    status: str
    created_at: datetime
    ocr_text: str | None = None


class ReviewIn(BaseModel):
    reviewer: str = Field(min_length=1, max_length=128)
    corrections: dict  # arbitrary field overrides keyed by field name


class ReviewOut(BaseModel):
    id: UUID
    extraction_id: UUID
    reviewer: str
    corrections: dict
    reviewed_at: datetime


class RegressionRow(BaseModel):
    filename: str
    expected: dict
    extracted: dict
    field_matches: dict[str, bool]
    correctness: float


class RegressionResult(BaseModel):
    prompt_version: str
    n: int
    mean_correctness: float
    rows: list[RegressionRow]
