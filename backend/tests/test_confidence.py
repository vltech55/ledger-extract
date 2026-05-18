from __future__ import annotations

from extraction.extract.confidence import adjusted_confidences, compute_signals
from extraction.extract.invoice import Invoice


def _f(value, conf=0.9, evidence="ok"):
    return {"value": value, "confidence": conf, "evidence": evidence}


def _build(**overrides) -> Invoice:
    data = {
        "vendor_name": _f("Acme"),
        "vendor_address": _f("Anywhere"),
        "invoice_number": _f("INV-001"),
        "invoice_date": _f("2026-01-15"),
        "due_date": _f("2026-02-15"),
        "currency": _f("USD"),
        "subtotal": _f(100.0),
        "tax_amount": _f(10.0),
        "total_amount": _f(110.0),
        "line_items": [
            {"description": "x", "quantity": 1, "unit_price": 100.0, "line_total": 100.0}
        ],
        "line_items_confidence": 0.8,
    }
    data.update(overrides)
    return Invoice.model_validate(data)


def test_clean_invoice_passes_all_signals() -> None:
    sig = compute_signals(_build())
    assert sig.total_reconciles
    assert sig.line_items_sum_matches
    assert sig.dates_consistent
    assert sig.currency_recognized
    assert sig.invoice_number_well_formed


def test_total_mismatch_detected() -> None:
    sig = compute_signals(_build(total_amount=_f(999.0)))
    assert sig.total_reconciles is False
    assert sig.line_items_sum_matches is False


def test_unrecognized_currency_flagged() -> None:
    # Currency validator nulls invalid 3-letter codes; "XYZ" is 3 letters so it passes
    # schema but isn't in our recognized set.
    sig = compute_signals(_build(currency=_f("XYZ")))
    assert sig.currency_recognized is False


def test_due_before_invoice_flagged() -> None:
    sig = compute_signals(_build(due_date=_f("2025-12-15")))  # before invoice_date
    assert sig.dates_consistent is False


def test_blend_boosts_when_heuristics_agree() -> None:
    inv = _build(total_amount=_f(110.0, conf=0.5))
    sig = compute_signals(inv)
    conf = adjusted_confidences(inv, sig)
    assert conf["total_amount"] > 0.5  # blended up by total_reconciles + line_items_sum_matches


def test_blend_does_not_penalize_when_heuristics_disagree() -> None:
    inv = _build(total_amount=_f(99.0, conf=0.5))  # mismatched
    sig = compute_signals(inv)
    conf = adjusted_confidences(inv, sig)
    # No penalty: blend is monotone non-decreasing in heuristic count.
    assert conf["total_amount"] == 0.5
