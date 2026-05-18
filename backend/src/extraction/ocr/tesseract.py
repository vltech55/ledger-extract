from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import pytesseract
from pdf2image import convert_from_path
from pypdf import PdfReader

from extraction.core.logging import get_logger

log = get_logger(__name__)

# Text-based PDFs (the common case for vendor-issued invoices) have an embedded
# text layer we can pull directly with pypdf — vastly faster and more accurate
# than running OCR. If that returns too little text, we fall back to Tesseract.
_MIN_TEXT_CHARS = 200


@dataclass(frozen=True)
class OcrResult:
    text: str
    page_count: int
    method: str  # "pypdf" or "tesseract"


def _try_pypdf(path: Path) -> tuple[str, int]:
    reader = PdfReader(str(path))
    parts: list[str] = []
    for page in reader.pages:
        try:
            parts.append(page.extract_text() or "")
        except Exception as exc:  # noqa: BLE001
            log.warning("pypdf_page_failed", error=str(exc))
    return "\n\n".join(p.strip() for p in parts if p.strip()), len(reader.pages)


def _try_tesseract(path: Path) -> tuple[str, int]:
    images = convert_from_path(str(path), dpi=200, fmt="png")
    parts: list[str] = []
    for img in images:
        parts.append(pytesseract.image_to_string(img, lang="eng"))
    return "\n\n".join(p.strip() for p in parts if p.strip()), len(images)


def extract_text(path: Path) -> OcrResult:
    """Try pypdf first; if it returns too little text, run Tesseract OCR.

    This is the right default for invoices: vendor-issued PDFs are usually
    digital-native (pypdf path), scanned ones need OCR (tesseract path).
    """
    text, pages = _try_pypdf(path)
    if len(text) >= _MIN_TEXT_CHARS:
        log.info("ocr_pypdf", path=str(path), chars=len(text), pages=pages)
        return OcrResult(text=text, page_count=pages, method="pypdf")

    log.info("ocr_fallback_tesseract", path=str(path), pypdf_chars=len(text))
    text2, pages2 = _try_tesseract(path)
    return OcrResult(text=text2, page_count=pages2, method="tesseract")
