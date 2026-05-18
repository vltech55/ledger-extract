from __future__ import annotations

from functools import lru_cache

from anthropic import Anthropic
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from extraction.core.config import settings
from extraction.core.logging import get_logger
from extraction.extract.invoice import Invoice
from extraction.extract.prompts import get_prompt

log = get_logger(__name__)


@lru_cache(maxsize=1)
def _client() -> Anthropic:
    return Anthropic(api_key=settings.anthropic_api_key)


# Claude function-calling tool schema. We hand-write it to keep the field
# descriptions tight and aligned with prompt v2 conventions.
_TOOL = {
    "name": "record_invoice",
    "description": "Record the structured extraction of an invoice from OCR text.",
    "input_schema": {
        "type": "object",
        "additionalProperties": False,
        "required": [
            "vendor_name",
            "vendor_address",
            "invoice_number",
            "invoice_date",
            "due_date",
            "currency",
            "subtotal",
            "tax_amount",
            "total_amount",
            "line_items",
            "line_items_confidence",
        ],
        "properties": {
            "vendor_name": {"$ref": "#/$defs/StringField"},
            "vendor_address": {"$ref": "#/$defs/StringField"},
            "invoice_number": {"$ref": "#/$defs/StringField"},
            "invoice_date": {"$ref": "#/$defs/DateField"},
            "due_date": {"$ref": "#/$defs/DateField"},
            "currency": {"$ref": "#/$defs/StringField"},
            "subtotal": {"$ref": "#/$defs/NumberField"},
            "tax_amount": {"$ref": "#/$defs/NumberField"},
            "total_amount": {"$ref": "#/$defs/NumberField"},
            "line_items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["description", "quantity", "unit_price", "line_total"],
                    "properties": {
                        "description": {"type": "string"},
                        "quantity": {"type": "number"},
                        "unit_price": {"type": "number"},
                        "line_total": {"type": "number"},
                    },
                },
            },
            "line_items_confidence": {"type": "number", "minimum": 0, "maximum": 1},
        },
        "$defs": {
            "StringField": {
                "type": "object",
                "additionalProperties": False,
                "required": ["value", "confidence", "evidence"],
                "properties": {
                    "value": {"type": ["string", "null"]},
                    "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                    "evidence": {"type": ["string", "null"]},
                },
            },
            "DateField": {
                "type": "object",
                "additionalProperties": False,
                "required": ["value", "confidence", "evidence"],
                "properties": {
                    "value": {"type": ["string", "null"], "description": "YYYY-MM-DD"},
                    "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                    "evidence": {"type": ["string", "null"]},
                },
            },
            "NumberField": {
                "type": "object",
                "additionalProperties": False,
                "required": ["value", "confidence", "evidence"],
                "properties": {
                    "value": {"type": ["number", "null"]},
                    "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                    "evidence": {"type": ["string", "null"]},
                },
            },
        },
    },
}


class ExtractionError(RuntimeError):
    pass


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=15),
    retry=retry_if_exception_type((TimeoutError, ConnectionError)),
    reraise=True,
)
def extract_invoice(
    ocr_text: str,
    prompt_version: str | None = None,
) -> tuple[Invoice, dict, str]:
    """Run Claude function calling against the OCR text.

    Returns (validated Invoice, raw tool_use input dict, prompt_version used).
    Raises ExtractionError if the model declines to call the tool or returns invalid data.
    """
    version = prompt_version or settings.prompt_version
    prompt = get_prompt(version)

    resp = _client().messages.create(
        model=settings.anthropic_model,
        max_tokens=2048,
        temperature=0.0,
        system=prompt.system,
        tools=[_TOOL],
        tool_choice={"type": "tool", "name": "record_invoice"},
        messages=[
            {
                "role": "user",
                "content": (
                    f"<ocr_text>\n{ocr_text[:18000]}\n</ocr_text>\n\n"
                    "Call record_invoice with the extracted fields."
                ),
            }
        ],
    )

    tool_block = next(
        (b for b in resp.content if getattr(b, "type", "") == "tool_use"),
        None,
    )
    if tool_block is None:
        raise ExtractionError("model did not call record_invoice")

    raw = dict(tool_block.input)
    try:
        invoice = Invoice.model_validate(raw)
    except Exception as exc:
        log.warning("invoice_validation_failed", error=str(exc), raw=str(raw)[:500])
        raise ExtractionError(f"validation failed: {exc}") from exc

    return invoice, raw, version
