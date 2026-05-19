"""Generate synthetic invoice PDFs (with embedded text) and a ground-truth JSON.

Each PDF has a deterministic layout so the regression suite is reproducible.
PDFs go to $SAMPLES_DIR; ground_truth.json sits beside them with the
expected extracted values per file.
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path

from fpdf import FPDF

from extraction.core.config import settings
from extraction.core.logging import configure_logging, get_logger

log = get_logger("seed.samples")


@dataclass
class _Line:
    description: str
    quantity: float
    unit_price: float

    @property
    def line_total(self) -> float:
        return round(self.quantity * self.unit_price, 2)


@dataclass
class _Sample:
    filename: str
    vendor_name: str
    vendor_address: str
    invoice_number: str
    invoice_date: str
    due_date: str
    currency: str
    tax_rate: float
    lines: list[_Line]

    @property
    def subtotal(self) -> float:
        return round(sum(li.line_total for li in self.lines), 2)

    @property
    def tax_amount(self) -> float:
        return round(self.subtotal * self.tax_rate, 2)

    @property
    def total_amount(self) -> float:
        return round(self.subtotal + self.tax_amount, 2)


_SAMPLES: list[_Sample] = [
    _Sample(
        filename="invoice-001.pdf",
        vendor_name="Northwind Optics GmbH",
        vendor_address="Friedrichstr. 12, 10117 Berlin, DE",
        invoice_number="NW-2026-0142",
        invoice_date="2026-04-12",
        due_date="2026-05-12",
        currency="EUR",
        tax_rate=0.19,
        lines=[
            _Line("4K Display 27\"", 2, 549.00),
            _Line("USB-C Hub 7-port", 4, 79.50),
        ],
    ),
    _Sample(
        filename="invoice-002.pdf",
        vendor_name="Aurora Cloud Services Inc.",
        vendor_address="500 Market St, San Francisco, CA 94105, USA",
        invoice_number="ACS-INV-220045",
        invoice_date="2026-04-30",
        due_date="2026-05-30",
        currency="USD",
        tax_rate=0.085,
        lines=[
            _Line("Compute hours (m5.xlarge)", 720, 0.192),
            _Line("Egress GB", 4200, 0.09),
            _Line("Object storage TB-month", 2, 21.00),
        ],
    ),
    _Sample(
        filename="invoice-003.pdf",
        vendor_name="Sakura Manufacturing K.K.",
        vendor_address="3-5-2 Roppongi, Minato, Tokyo 106-0032",
        invoice_number="SM-26/A0089",
        invoice_date="2026-03-05",
        due_date="2026-04-05",
        currency="JPY",
        tax_rate=0.10,
        lines=[
            _Line("Precision bearing 6204", 200, 480),
            _Line("Sealing ring", 200, 95),
        ],
    ),
    _Sample(
        filename="invoice-004.pdf",
        vendor_name="Cordillera Coffee Ltda.",
        vendor_address="Cra. 7 #15-22, Bogotá, Colombia",
        invoice_number="CC-0011-2026",
        invoice_date="2026-04-22",
        due_date="2026-05-06",
        currency="USD",
        tax_rate=0.05,
        lines=[
            _Line("Single-origin beans 1kg", 50, 18.50),
        ],
    ),
    _Sample(
        filename="invoice-005.pdf",
        vendor_name="Albion Legal LLP",
        vendor_address="42 King William St, London EC4R 9DD, UK",
        invoice_number="ALB/2026/Q2/0067",
        invoice_date="2026-04-15",
        due_date="2026-05-15",
        currency="GBP",
        tax_rate=0.20,
        lines=[
            _Line("Partner hours - contract review", 6, 380.00),
            _Line("Associate hours - drafting", 12, 220.00),
            _Line("Disbursements", 1, 145.50),
        ],
    ),
]


def _render(sample: _Sample, out_path: Path) -> None:
    pdf = FPDF(format="A4")
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 10, sample.vendor_name, ln=1)
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 5, sample.vendor_address)
    pdf.ln(4)

    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 8, "INVOICE", ln=1)
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(60, 6, "Invoice Number:", 0, 0)
    pdf.cell(0, 6, sample.invoice_number, ln=1)
    pdf.cell(60, 6, "Invoice Date:", 0, 0)
    pdf.cell(0, 6, sample.invoice_date, ln=1)
    pdf.cell(60, 6, "Due Date:", 0, 0)
    pdf.cell(0, 6, sample.due_date, ln=1)
    pdf.cell(60, 6, "Currency:", 0, 0)
    pdf.cell(0, 6, sample.currency, ln=1)
    pdf.ln(6)

    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(90, 7, "Description")
    pdf.cell(20, 7, "Qty", align="R")
    pdf.cell(35, 7, "Unit Price", align="R")
    pdf.cell(35, 7, "Line Total", align="R", ln=1)
    pdf.set_draw_color(180, 180, 180)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(1)
    pdf.set_font("Helvetica", "", 11)
    for li in sample.lines:
        pdf.cell(90, 7, li.description)
        pdf.cell(20, 7, f"{li.quantity:g}", align="R")
        pdf.cell(35, 7, f"{li.unit_price:.2f}", align="R")
        pdf.cell(35, 7, f"{li.line_total:.2f}", align="R", ln=1)

    pdf.ln(4)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(3)
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(145, 6, "Subtotal", align="R")
    pdf.cell(35, 6, f"{sample.subtotal:.2f}", align="R", ln=1)
    pdf.cell(145, 6, f"Tax ({sample.tax_rate * 100:.1f}%)", align="R")
    pdf.cell(35, 6, f"{sample.tax_amount:.2f}", align="R", ln=1)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(145, 8, "Total", align="R")
    pdf.cell(35, 8, f"{sample.total_amount:.2f} {sample.currency}", align="R", ln=1)

    pdf.output(str(out_path))


def main() -> None:
    configure_logging()
    out_dir = Path(settings.samples_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    ground_truth: dict[str, dict] = {}
    for s in _SAMPLES:
        out = out_dir / s.filename
        _render(s, out)
        ground_truth[s.filename] = {
            "vendor_name": s.vendor_name,
            "vendor_address": s.vendor_address,
            "invoice_number": s.invoice_number,
            "invoice_date": s.invoice_date,
            "due_date": s.due_date,
            "currency": s.currency,
            "subtotal": s.subtotal,
            "tax_amount": s.tax_amount,
            "total_amount": s.total_amount,
            "line_items": [asdict(li) | {"line_total": li.line_total} for li in s.lines],
        }
        log.info("sample_generated", path=str(out))

    (out_dir / "ground_truth.json").write_text(json.dumps(ground_truth, indent=2))
    log.info("ground_truth_written", samples=len(_SAMPLES))


if __name__ == "__main__":
    main()
