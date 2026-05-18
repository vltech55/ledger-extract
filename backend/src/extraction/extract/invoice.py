from __future__ import annotations

from datetime import date
from typing import Annotated, Generic, TypeVar

from pydantic import BaseModel, Field, field_validator

T = TypeVar("T")


class FieldExtract(BaseModel, Generic[T]):
    """Wrapper for one extracted field.

    `value` is the actual extracted value; `confidence` is the LLM's
    self-reported confidence in [0, 1]; `evidence` is the verbatim text
    snippet the LLM cited from the OCR output. Heuristic checks performed
    later may adjust the overall confidence; this struct is the LLM's
    *self-report* only.
    """

    value: T | None
    confidence: float = Field(ge=0.0, le=1.0)
    evidence: str | None = None


class LineItem(BaseModel):
    description: str
    quantity: float = Field(gt=0)
    unit_price: float = Field(ge=0)
    line_total: float = Field(ge=0)


class Invoice(BaseModel):
    """Strict Pydantic schema returned by the LLM via Claude tool/function calling.

    Every top-level field is wrapped in FieldExtract so per-field confidence is
    part of the contract. Line items are a list of plain LineItem models —
    confidence applies to the *list as a whole* (see line_items_confidence)."""

    vendor_name: FieldExtract[str]
    vendor_address: FieldExtract[str]
    invoice_number: FieldExtract[str]
    invoice_date: FieldExtract[date]
    due_date: FieldExtract[date]
    currency: FieldExtract[str]
    subtotal: FieldExtract[float]
    tax_amount: FieldExtract[float]
    total_amount: FieldExtract[float]
    line_items: list[LineItem]
    line_items_confidence: float = Field(ge=0.0, le=1.0)

    @field_validator("currency")
    @classmethod
    def _currency_isoish(cls, v: FieldExtract[str]) -> FieldExtract[str]:
        # Accept 3-letter ISO codes; if the value isn't 3 letters, drop the value
        # but keep the confidence/evidence so the heuristic layer can downgrade it.
        if v.value is not None:
            cleaned = v.value.strip().upper()
            if len(cleaned) == 3 and cleaned.isalpha():
                return FieldExtract[str](
                    value=cleaned, confidence=v.confidence, evidence=v.evidence
                )
            return FieldExtract[str](value=None, confidence=v.confidence, evidence=v.evidence)
        return v


InvoiceField = Annotated[FieldExtract, "one of the top-level Invoice fields"]
