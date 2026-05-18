from __future__ import annotations

import asyncio
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from extraction.core.config import settings
from extraction.core.logging import get_logger
from extraction.extract.llm_extract import ExtractionError, extract_invoice
from extraction.ocr.tesseract import extract_text
from extraction.schemas import RegressionResult, RegressionRow

router = APIRouter(prefix="/eval", tags=["eval"])
log = get_logger(__name__)


def _flat(extracted: dict) -> dict:
    """Project the FieldExtract-wrapped Invoice dict down to scalar values per field."""
    out: dict = {}
    for k, v in extracted.items():
        if isinstance(v, dict) and "value" in v:
            out[k] = v["value"]
        elif k == "line_items":
            out[k] = v
    return out


def _compare(expected: dict, extracted: dict) -> tuple[dict[str, bool], float]:
    flat = _flat(extracted)
    matches: dict[str, bool] = {}
    for key, exp in expected.items():
        if key == "line_items":
            got = flat.get("line_items") or []
            matches[key] = len(got) == len(exp)
            continue
        got_val = flat.get(key)
        if isinstance(exp, float) and isinstance(got_val, (int, float)):
            matches[key] = abs(float(got_val) - exp) <= 0.02 * max(abs(exp), 1.0)
        else:
            matches[key] = str(got_val) == str(exp) if got_val is not None else False
    correctness = sum(matches.values()) / max(len(matches), 1)
    return matches, correctness


@router.get("/regression", response_model=RegressionResult)
async def regression() -> RegressionResult:
    samples_dir = Path(settings.samples_dir)
    truth_file = samples_dir / "ground_truth.json"
    if not truth_file.exists():
        raise HTTPException(
            status_code=409,
            detail="no ground truth at " + str(truth_file) + " — run `make seed` first",
        )
    truth = json.loads(truth_file.read_text())

    rows: list[RegressionRow] = []
    for filename, expected in truth.items():
        path = samples_dir / filename
        if not path.exists():
            log.warning("sample_missing", filename=filename)
            continue
        ocr = await asyncio.to_thread(extract_text, path)
        try:
            invoice, _, _ = await asyncio.to_thread(extract_invoice, ocr.text)
        except ExtractionError as exc:
            log.warning("regression_extract_failed", filename=filename, error=str(exc))
            rows.append(
                RegressionRow(
                    filename=filename,
                    expected=expected,
                    extracted={},
                    field_matches={k: False for k in expected},
                    correctness=0.0,
                )
            )
            continue
        extracted = json.loads(invoice.model_dump_json())
        matches, correctness = _compare(expected, extracted)
        rows.append(
            RegressionRow(
                filename=filename,
                expected=expected,
                extracted=extracted,
                field_matches=matches,
                correctness=round(correctness, 4),
            )
        )

    mean = sum(r.correctness for r in rows) / max(len(rows), 1)
    return RegressionResult(
        prompt_version=settings.prompt_version,
        n=len(rows),
        mean_correctness=round(mean, 4),
        rows=rows,
    )
