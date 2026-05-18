"""CLI wrapper around the /eval/regression endpoint.

Runs every sample through the current prompt and prints a comparison table.
Used to A/B test prompt versions against the same ground truth set.
"""
from __future__ import annotations

import asyncio
import json

import httpx

from extraction.core.config import settings
from extraction.core.logging import configure_logging, get_logger


async def main() -> None:
    configure_logging()
    log = get_logger("regression")
    base = f"http://localhost:{settings.api_port}"
    async with httpx.AsyncClient(timeout=300.0) as client:
        resp = await client.get(f"{base}/eval/regression")
    resp.raise_for_status()
    result = resp.json()

    print()  # noqa: T201
    print(f"=== Regression: prompt {result['prompt_version']} ===")  # noqa: T201
    print(f"N:    {result['n']}")  # noqa: T201
    print(f"Mean correctness:  {result['mean_correctness']:.4f}")  # noqa: T201
    print()  # noqa: T201
    for row in result["rows"]:
        print(f"  {row['filename']}: {row['correctness']:.2f}")  # noqa: T201
        misses = [k for k, v in row["field_matches"].items() if not v]
        if misses:
            print(f"      missed: {', '.join(misses)}")  # noqa: T201

    out_path = settings.samples_dir + f"/regression-{result['prompt_version']}.json"
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(result, fh, indent=2)
    log.info("written", path=out_path)


if __name__ == "__main__":
    asyncio.run(main())
