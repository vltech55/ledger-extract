from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date

from extraction.extract.invoice import Invoice

# ISO 4217 codes the demo cares about. The schema-level validator already rejects
# non-3-letter strings; this set lets the heuristic layer downgrade exotic codes.
_COMMON_CURRENCIES: set[str] = {
    "USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "CNY", "INR", "BRL", "MXN", "SEK",
    "NOK", "DKK", "PLN", "ZAR", "NZD", "SGD", "HKD",
}

_INVOICE_NUMBER_RE = re.compile(r"^[A-Z0-9][A-Z0-9\-_/.]{1,40}$", re.IGNORECASE)


@dataclass(frozen=True)
class HeuristicSignals:
    total_reconciles: bool          # subtotal + tax ≈ total
    line_items_sum_matches: bool    # sum(line_total) ≈ subtotal (or total if no subtotal)
    dates_consistent: bool          # due_date >= invoice_date
    currency_recognized: bool
    invoice_number_well_formed: bool

    def to_dict(self) -> dict[str, bool]:
        return {
            "total_reconciles": self.total_reconciles,
            "line_items_sum_matches": self.line_items_sum_matches,
            "dates_consistent": self.dates_consistent,
            "currency_recognized": self.currency_recognized,
            "invoice_number_well_formed": self.invoice_number_well_formed,
        }


def _close(a: float | None, b: float | None, *, tol: float = 0.02) -> bool:
    """True if a is within `tol` (relative) of b. Treats None on either side as False."""
    if a is None or b is None:
        return False
    if abs(b) < 1e-9:
        return abs(a) < 1e-6
    return abs(a - b) / max(abs(b), 1e-9) <= tol


def _is_iso_date(s: str | None) -> date | None:
    if not s:
        return None
    try:
        return date.fromisoformat(s)
    except (ValueError, TypeError):
        return None


def compute_signals(inv: Invoice) -> HeuristicSignals:
    subtotal = inv.subtotal.value
    tax = inv.tax_amount.value
    total = inv.total_amount.value
    items_sum = sum(li.line_total for li in inv.line_items) if inv.line_items else None

    total_reconciles = (
        subtotal is not None and tax is not None and total is not None
        and _close(round(subtotal + tax, 2), total)
    )
    if inv.line_items:
        compare_to = subtotal if subtotal is not None else total
        items_match = _close(items_sum, compare_to) if items_sum is not None else False
    else:
        items_match = False

    d1 = _is_iso_date(_normalize_date(inv.invoice_date.value))
    d2 = _is_iso_date(_normalize_date(inv.due_date.value))
    dates_consistent = d1 is not None and d2 is not None and d2 >= d1

    currency_recognized = inv.currency.value is not None and inv.currency.value in _COMMON_CURRENCIES

    inv_num = inv.invoice_number.value
    invoice_number_ok = bool(inv_num and _INVOICE_NUMBER_RE.match(inv_num))

    return HeuristicSignals(
        total_reconciles=total_reconciles,
        line_items_sum_matches=items_match,
        dates_consistent=dates_consistent,
        currency_recognized=currency_recognized,
        invoice_number_well_formed=invoice_number_ok,
    )


def _normalize_date(v: object) -> str | None:
    """invoice_date.value may already be a `date` (Pydantic coerced it) or a string."""
    if v is None:
        return None
    if isinstance(v, date):
        return v.isoformat()
    return str(v)


def blend(field_conf: float, *boosts: bool, weight: float = 0.5) -> float:
    """Combine LLM self-confidence with heuristic signals.

    Each True signal contributes +weight/N up to a cap; each False signal
    is neutral (no penalty). The LLM remains the primary signal — heuristics
    boost trust when independent checks agree."""
    if not boosts:
        return min(1.0, field_conf)
    boost = sum(1 for b in boosts if b) / len(boosts) * weight
    return min(1.0, field_conf + boost)


def adjusted_confidences(inv: Invoice, signals: HeuristicSignals) -> dict[str, float]:
    """Per-field final confidence after blending with heuristic signals.

    Returned dict keys mirror Invoice top-level fields plus 'line_items'.
    Each value is in [0, 1]."""
    return {
        "vendor_name": inv.vendor_name.confidence,
        "vendor_address": inv.vendor_address.confidence,
        "invoice_number": blend(inv.invoice_number.confidence, signals.invoice_number_well_formed),
        "invoice_date": blend(inv.invoice_date.confidence, signals.dates_consistent),
        "due_date": blend(inv.due_date.confidence, signals.dates_consistent),
        "currency": blend(inv.currency.confidence, signals.currency_recognized),
        "subtotal": blend(
            inv.subtotal.confidence, signals.total_reconciles, signals.line_items_sum_matches
        ),
        "tax_amount": blend(inv.tax_amount.confidence, signals.total_reconciles),
        "total_amount": blend(
            inv.total_amount.confidence, signals.total_reconciles, signals.line_items_sum_matches
        ),
        "line_items": blend(inv.line_items_confidence, signals.line_items_sum_matches),
    }
