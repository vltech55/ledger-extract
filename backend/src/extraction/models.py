from __future__ import annotations

import enum
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from extraction.db import Base


class DocumentStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    extracted = "extracted"
    failed = "failed"


class ExtractionStatus(str, enum.Enum):
    auto_approved = "auto_approved"
    needs_review = "needs_review"
    reviewed_corrected = "reviewed_corrected"
    failed = "failed"


class Document(Base):
    __tablename__ = "documents"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    filename: Mapped[str] = mapped_column(String(512))
    content_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    file_path: Mapped[str] = mapped_column(Text)
    byte_size: Mapped[int] = mapped_column(Integer)
    page_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[DocumentStatus] = mapped_column(
        Enum(DocumentStatus, name="document_status"), default=DocumentStatus.pending
    )
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    extractions: Mapped[list[Extraction]] = relationship(
        "Extraction", back_populates="document", cascade="all, delete-orphan"
    )


class Extraction(Base):
    __tablename__ = "extractions"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    document_id: Mapped[UUID] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), index=True
    )
    prompt_version: Mapped[str] = mapped_column(String(16))
    model: Mapped[str] = mapped_column(String(64))
    ocr_text: Mapped[str] = mapped_column(Text)
    raw_llm_output: Mapped[dict] = mapped_column(JSONB)
    fields: Mapped[dict] = mapped_column(JSONB)
    min_confidence: Mapped[float] = mapped_column(Float)
    mean_confidence: Mapped[float] = mapped_column(Float)
    heuristic_signals: Mapped[dict] = mapped_column(JSONB)
    status: Mapped[ExtractionStatus] = mapped_column(
        Enum(ExtractionStatus, name="extraction_status")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    document: Mapped[Document] = relationship("Document", back_populates="extractions")
    review: Mapped[Review | None] = relationship(
        "Review", back_populates="extraction", uselist=False, cascade="all, delete-orphan"
    )


class Review(Base):
    __tablename__ = "reviews"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    extraction_id: Mapped[UUID] = mapped_column(
        ForeignKey("extractions.id", ondelete="CASCADE"), unique=True
    )
    reviewer: Mapped[str] = mapped_column(String(128))
    corrections: Mapped[dict] = mapped_column(JSONB)
    reviewed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    extraction: Mapped[Extraction] = relationship("Extraction", back_populates="review")


class AuditLog(Base):
    __tablename__ = "audit_log"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    entity_type: Mapped[str] = mapped_column(String(32), index=True)
    entity_id: Mapped[UUID] = mapped_column(index=True)
    action: Mapped[str] = mapped_column(String(64))
    payload: Mapped[dict] = mapped_column(JSONB)
    actor: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
