from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from extraction.core.logging import get_logger
from extraction.db import get_session
from extraction.models import AuditLog, Document, Extraction, ExtractionStatus, Review
from extraction.schemas import ExtractionOut, ReviewIn, ReviewOut

router = APIRouter(prefix="/review", tags=["review"])
log = get_logger(__name__)


@router.get("/queue", response_model=list[ExtractionOut])
async def review_queue(
    limit: int = 50,
    session: AsyncSession = Depends(get_session),
) -> list[ExtractionOut]:
    stmt = (
        select(Extraction)
        .where(Extraction.status == ExtractionStatus.needs_review)
        .options(joinedload(Extraction.document))
        .order_by(Extraction.min_confidence.asc(), desc(Extraction.created_at))
        .limit(limit)
    )
    rows = (await session.execute(stmt)).scalars().all()
    return [
        ExtractionOut(
            id=e.id,
            document_id=e.document_id,
            document_filename=e.document.filename,
            prompt_version=e.prompt_version,
            model=e.model,
            fields=e.fields,
            min_confidence=e.min_confidence,
            mean_confidence=e.mean_confidence,
            heuristic_signals=e.heuristic_signals,
            status=e.status.value,
            created_at=e.created_at,
        )
        for e in rows
    ]


@router.post("/{extraction_id}/correct", response_model=ReviewOut)
async def submit_corrections(
    extraction_id: UUID,
    body: ReviewIn,
    session: AsyncSession = Depends(get_session),
) -> ReviewOut:
    stmt = (
        select(Extraction)
        .where(Extraction.id == extraction_id)
        .options(selectinload(Extraction.review), selectinload(Extraction.document))
    )
    ext = (await session.execute(stmt)).scalar_one_or_none()
    if ext is None:
        raise HTTPException(status_code=404, detail="extraction not found")
    if ext.review is not None:
        raise HTTPException(status_code=409, detail="extraction already reviewed")

    review = Review(
        extraction_id=ext.id,
        reviewer=body.reviewer,
        corrections=body.corrections,
    )
    session.add(review)

    # Mark the extraction reviewed-and-corrected, and apply the overrides on the
    # fields snapshot so downstream consumers see the corrected values.
    updated_fields = dict(ext.fields)
    for k, v in body.corrections.items():
        if k in updated_fields and isinstance(updated_fields[k], dict):
            updated_fields[k] = {**updated_fields[k], "value": v, "reviewer_corrected": True}
        else:
            updated_fields[k] = v
    ext.fields = updated_fields
    ext.status = ExtractionStatus.reviewed_corrected

    session.add(
        AuditLog(
            entity_type="extraction",
            entity_id=ext.id,
            action="reviewed",
            payload={
                "reviewer": body.reviewer,
                "fields_corrected": sorted(body.corrections.keys()),
            },
            actor=body.reviewer,
        )
    )
    await session.commit()
    await session.refresh(review)

    return ReviewOut(
        id=review.id,
        extraction_id=review.extraction_id,
        reviewer=review.reviewer,
        corrections=review.corrections,
        reviewed_at=review.reviewed_at,
    )


@router.get("/{extraction_id}", response_model=ExtractionOut)
async def get_for_review(
    extraction_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> ExtractionOut:
    stmt = (
        select(Extraction)
        .where(Extraction.id == extraction_id)
        .options(joinedload(Extraction.document))
    )
    ext = (await session.execute(stmt)).scalar_one_or_none()
    if ext is None:
        raise HTTPException(status_code=404, detail="extraction not found")
    return ExtractionOut(
        id=ext.id,
        document_id=ext.document_id,
        document_filename=ext.document.filename,
        prompt_version=ext.prompt_version,
        model=ext.model,
        fields=ext.fields,
        min_confidence=ext.min_confidence,
        mean_confidence=ext.mean_confidence,
        heuristic_signals=ext.heuristic_signals,
        status=ext.status.value,
        created_at=ext.created_at,
        ocr_text=ext.ocr_text,
    )
