from __future__ import annotations

import hashlib
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from extraction.core.config import settings
from extraction.core.logging import get_logger
from extraction.db import get_session
from extraction.models import AuditLog, Document, DocumentStatus
from extraction.schemas import DocumentOut, ExtractionOut

router = APIRouter(prefix="/documents", tags=["documents"])
log = get_logger(__name__)


def _to_out(doc: Document) -> DocumentOut:
    ext = doc.extractions[0] if doc.extractions else None
    return DocumentOut(
        id=doc.id,
        filename=doc.filename,
        status=doc.status.value,
        failure_reason=doc.failure_reason,
        page_count=doc.page_count,
        byte_size=doc.byte_size,
        uploaded_at=doc.uploaded_at,
        extraction_id=ext.id if ext else None,
        extraction_status=ext.status.value if ext else None,
        min_confidence=ext.min_confidence if ext else None,
    )


@router.post("", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
) -> DocumentOut:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="only .pdf uploads are accepted")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty file")
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"file exceeds {settings.max_upload_mb} MB cap",
        )

    digest = hashlib.sha256(data).hexdigest()

    existing = (
        await session.execute(
            select(Document)
            .where(Document.content_hash == digest)
            .options(selectinload(Document.extractions))
        )
    ).scalar_one_or_none()
    if existing is not None:
        # Idempotent: re-uploading the same bytes returns the prior record.
        log.info("doc_dedup", filename=file.filename, content_hash=digest[:12])
        return _to_out(existing)

    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    doc_id = uuid4()
    out_path = Path(settings.upload_dir) / f"{doc_id}.pdf"
    out_path.write_bytes(data)

    doc = Document(
        id=doc_id,
        filename=file.filename,
        content_hash=digest,
        file_path=str(out_path),
        byte_size=len(data),
        status=DocumentStatus.pending,
    )
    session.add(doc)
    session.add(
        AuditLog(
            entity_type="document",
            entity_id=doc.id,
            action="uploaded",
            payload={"filename": file.filename, "bytes": len(data)},
        )
    )
    await session.commit()

    # Enqueue extraction. Imported here to avoid coupling FastAPI startup to celery.
    from extraction.worker import celery_app  # noqa: PLC0415

    celery_app.send_task(
        "extraction.tasks.extract.run_extraction", args=[str(doc.id)]
    )

    await session.refresh(doc, attribute_names=["extractions"])
    return _to_out(doc)


@router.get("", response_model=list[DocumentOut])
async def list_documents(
    limit: int = 50,
    session: AsyncSession = Depends(get_session),
) -> list[DocumentOut]:
    stmt = (
        select(Document)
        .options(selectinload(Document.extractions))
        .order_by(desc(Document.uploaded_at))
        .limit(limit)
    )
    rows = (await session.execute(stmt)).scalars().all()
    return [_to_out(d) for d in rows]


@router.get("/{doc_id}", response_model=ExtractionOut)
async def get_document_extraction(
    doc_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> ExtractionOut:
    stmt = (
        select(Document)
        .where(Document.id == doc_id)
        .options(selectinload(Document.extractions))
    )
    doc = (await session.execute(stmt)).scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=404, detail="document not found")
    if not doc.extractions:
        raise HTTPException(
            status_code=409,
            detail=f"document status is {doc.status.value} — no extraction yet",
        )
    ext = doc.extractions[0]
    return ExtractionOut(
        id=ext.id,
        document_id=ext.document_id,
        document_filename=doc.filename,
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
