from __future__ import annotations

import json
from pathlib import Path
from uuid import UUID

from celery import shared_task

from extraction.core.config import settings
from extraction.core.logging import get_logger
from extraction.db import SyncSessionLocal
from extraction.extract.confidence import adjusted_confidences, compute_signals
from extraction.extract.llm_extract import ExtractionError, extract_invoice
from extraction.models import (
    AuditLog,
    Document,
    DocumentStatus,
    Extraction,
    ExtractionStatus,
)
from extraction.ocr.tesseract import extract_text

log = get_logger("worker.extract")


def _audit(session, *, entity_type: str, entity_id: UUID, action: str, payload: dict) -> None:  # type: ignore[no-untyped-def]
    session.add(
        AuditLog(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            payload=payload,
            actor="worker",
        )
    )


@shared_task(bind=True, name="extraction.tasks.extract.run_extraction")
def run_extraction(self, document_id: str) -> dict:  # type: ignore[no-untyped-def]
    """Pipeline: load doc -> OCR -> LLM extract -> compute heuristic confidence ->
    persist Extraction with status."""
    doc_id = UUID(document_id)
    log.info("task_start", document_id=str(doc_id))

    with SyncSessionLocal() as session:
        doc = session.get(Document, doc_id)
        if doc is None:
            log.warning("doc_missing", document_id=str(doc_id))
            return {"status": "missing"}
        doc.status = DocumentStatus.processing
        _audit(
            session,
            entity_type="document",
            entity_id=doc_id,
            action="processing",
            payload={"file_path": doc.file_path},
        )
        session.commit()

    try:
        ocr = extract_text(Path(doc.file_path))
    except Exception as exc:
        log.exception("ocr_failed", error=str(exc))
        with SyncSessionLocal() as session:
            d = session.get(Document, doc_id)
            if d is not None:
                d.status = DocumentStatus.failed
                d.failure_reason = f"ocr: {exc}"
                _audit(
                    session,
                    entity_type="document",
                    entity_id=doc_id,
                    action="ocr_failed",
                    payload={"error": str(exc)},
                )
                session.commit()
        raise

    try:
        invoice, raw, version = extract_invoice(ocr.text)
    except ExtractionError as exc:
        log.warning("llm_extract_failed", error=str(exc))
        with SyncSessionLocal() as session:
            d = session.get(Document, doc_id)
            if d is not None:
                d.status = DocumentStatus.failed
                d.failure_reason = f"llm: {exc}"
                _audit(
                    session,
                    entity_type="document",
                    entity_id=doc_id,
                    action="extract_failed",
                    payload={"error": str(exc), "prompt_version": settings.prompt_version},
                )
                session.commit()
        raise self.retry(exc=exc, countdown=5)

    signals = compute_signals(invoice)
    field_conf = adjusted_confidences(invoice, signals)
    min_conf = min(field_conf.values()) if field_conf else 0.0
    mean_conf = sum(field_conf.values()) / max(len(field_conf), 1)

    status = (
        ExtractionStatus.auto_approved
        if min_conf >= settings.confidence_auto_approve
        else ExtractionStatus.needs_review
    )

    fields_jsonb = json.loads(invoice.model_dump_json())
    for k, v in field_conf.items():
        # Mirror the post-blend confidence back onto each field for the UI.
        if isinstance(fields_jsonb.get(k), dict):
            fields_jsonb[k]["adjusted_confidence"] = round(v, 4)
        elif k == "line_items":
            fields_jsonb["line_items_adjusted_confidence"] = round(v, 4)

    with SyncSessionLocal() as session:
        extraction = Extraction(
            document_id=doc_id,
            prompt_version=version,
            model=settings.anthropic_model,
            ocr_text=ocr.text,
            raw_llm_output=raw,
            fields=fields_jsonb,
            min_confidence=round(min_conf, 4),
            mean_confidence=round(mean_conf, 4),
            heuristic_signals=signals.to_dict(),
            status=status,
        )
        session.add(extraction)
        d = session.get(Document, doc_id)
        if d is not None:
            d.status = DocumentStatus.extracted
            d.page_count = ocr.page_count
        _audit(
            session,
            entity_type="document",
            entity_id=doc_id,
            action="extracted",
            payload={
                "min_confidence": round(min_conf, 4),
                "status": status.value,
                "prompt_version": version,
                "ocr_method": ocr.method,
            },
        )
        session.commit()
        eid = extraction.id

    log.info(
        "task_done",
        document_id=str(doc_id),
        extraction_id=str(eid),
        min_confidence=round(min_conf, 4),
        status=status.value,
    )
    return {
        "extraction_id": str(eid),
        "status": status.value,
        "min_confidence": round(min_conf, 4),
    }
