"""Upload every sample PDF to the local API, exercising the upload → queue → worker path.

Useful for the demo: one command to populate the dashboard with real extractions.
"""
from __future__ import annotations

import asyncio
from pathlib import Path

import httpx

from extraction.core.config import settings
from extraction.core.logging import configure_logging, get_logger


async def main() -> None:
    configure_logging()
    log = get_logger("ingest")
    samples_dir = Path(settings.samples_dir)
    pdfs = sorted(samples_dir.glob("*.pdf"))
    if not pdfs:
        log.warning("no_samples_found", dir=str(samples_dir))
        return

    base = f"http://localhost:{settings.api_port}"
    async with httpx.AsyncClient(timeout=30.0) as client:
        for path in pdfs:
            with open(path, "rb") as fh:
                files = {"file": (path.name, fh, "application/pdf")}
                resp = await client.post(f"{base}/documents", files=files)
            if resp.status_code in (200, 201):
                doc = resp.json()
                log.info(
                    "uploaded",
                    filename=path.name,
                    document_id=doc.get("id"),
                    status=doc.get("status"),
                )
            else:
                log.warning("upload_failed", filename=path.name, code=resp.status_code, body=resp.text[:200])


if __name__ == "__main__":
    asyncio.run(main())
