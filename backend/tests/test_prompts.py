from __future__ import annotations

import pytest

from extraction.extract.prompts import PROMPTS, get_prompt


def test_known_versions() -> None:
    assert {"v1", "v2"}.issubset(PROMPTS.keys())


def test_unknown_version_rejected() -> None:
    with pytest.raises(ValueError):
        get_prompt("v99")


def test_v2_mentions_anti_hallucination_guidance() -> None:
    p = get_prompt("v2")
    s = p.system.lower()
    assert "never invent" in s or "do not fabricate" in s or "never fabricate" in s or "verbatim substring" in s


def test_each_version_has_nonempty_system() -> None:
    for v, p in PROMPTS.items():
        assert p.version == v
        assert len(p.system) > 50
