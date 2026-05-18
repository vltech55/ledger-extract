from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class PromptVersion:
    version: str
    system: str
    notes: str


_V1 = PromptVersion(
    version="v1",
    notes="Initial baseline. Asks the model to extract fields with self-reported confidence.",
    system=(
        "You extract structured data from invoice text. "
        "Call the `record_invoice` tool with the extracted fields. "
        "For each field, include a confidence in [0,1] reflecting how certain you are, "
        "and an evidence snippet quoted verbatim from the source text. "
        "If a field is genuinely missing from the source, set its value to null with confidence 0."
    ),
)


_V2 = PromptVersion(
    version="v2",
    notes=(
        "Adds explicit anti-hallucination guidance and clarifies confidence calibration. "
        "Should produce fewer fabricated values when OCR is noisy."
    ),
    system=(
        "You extract structured data from invoice text obtained via OCR (which may contain "
        "scanning errors). Call the `record_invoice` tool with the extracted fields.\n\n"
        "RULES:\n"
        "1. Set value to null when a field is not clearly present. Never invent values to "
        "   fill fields. Confidence 0 for nulls.\n"
        "2. confidence in [0, 1]: 0.95+ means 'verbatim from a clear label', 0.7 means "
        "   'inferred from context but unambiguous', 0.4 means 'guess based on adjacent text'.\n"
        "3. evidence MUST be a verbatim substring of the source text. If you cannot quote it, "
        "   the value is fabricated — set value to null, confidence 0.\n"
        "4. Currency: 3-letter ISO 4217 code (USD, EUR, GBP, ...). If unsure, leave null.\n"
        "5. Dates: ISO 8601 (YYYY-MM-DD). If the source is ambiguous (e.g., '03/04/2024'), "
        "   prefer the format consistent with the vendor's locale; lower confidence to reflect "
        "   the ambiguity.\n"
        "6. Line items: each must have description, quantity > 0, unit_price >= 0, line_total."
    ),
)


PROMPTS: dict[str, PromptVersion] = {p.version: p for p in (_V1, _V2)}


def get_prompt(version: str) -> PromptVersion:
    if version not in PROMPTS:
        raise ValueError(f"unknown prompt version: {version}. known: {sorted(PROMPTS)}")
    return PROMPTS[version]
