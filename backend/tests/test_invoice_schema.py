from __future__ import annotations

import pytest
from pydantic import ValidationError

from extraction.extract.invoice import FieldExtract, Invoice, LineItem


def _f(value, conf=0.9, evidence="ok"):
    return {"value": value, "confidence": conf, "evidence": evidence}


def _base(**overrides):
    data = {
        "vendor_name": _f("Acme GmbH"),
        "vendor_address": _f("Berlin, DE"),
        "invoice_number": _f("INV-001"),
        "invoice_date": _f("2026-01-15"),
        "due_date": _f("2026-02-15"),
        "currency": _f("EUR"),
        "subtotal": _f(100.0),
        "tax_amount": _f(19.0),
        "total_amount": _f(119.0),
        "line_items": [
            {"description": "Widget", "quantity": 2, "unit_price": 50.0, "line_total": 100.0},
        ],
        "line_items_confidence": 0.9,
    }
    data.update(overrides)
    return data


def test_round_trip() -> None:
    inv = Invoice.model_validate(_base())
    assert inv.vendor_name.value == "Acme GmbH"
    assert inv.line_items[0].line_total == 100.0


def test_confidence_bounds_enforced() -> None:
    with pytest.raises(ValidationError):
        FieldExtract[str](value="x", confidence=1.5)


def test_line_item_quantity_must_be_positive() -> None:
    with pytest.raises(ValidationError):
        LineItem(description="x", quantity=0, unit_price=1.0, line_total=0.0)


def test_currency_validator_strips_and_uppercases() -> None:
    inv = Invoice.model_validate(_base(currency=_f(" eur ")))
    assert inv.currency.value == "EUR"


def test_currency_validator_nulls_bad_codes_but_keeps_metadata() -> None:
    inv = Invoice.model_validate(_base(currency=_f("Euros")))
    assert inv.currency.value is None
    assert inv.currency.confidence == 0.9


def test_null_value_with_zero_confidence_accepted() -> None:
    inv = Invoice.model_validate(_base(due_date=_f(None, conf=0.0, evidence=None)))
    assert inv.due_date.value is None
    assert inv.due_date.confidence == 0.0
