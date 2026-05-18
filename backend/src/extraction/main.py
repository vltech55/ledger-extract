from __future__ import annotations

import time
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from extraction import __version__
from extraction.api import documents as documents_api
from extraction.api import eval as eval_api
from extraction.api import health as health_api
from extraction.api import review as review_api
from extraction.core.config import settings
from extraction.core.logging import configure_logging, get_logger

log = get_logger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    configure_logging()
    log.info("startup", version=__version__, prompt_version=settings.prompt_version)
    yield
    log.info("shutdown")


app = FastAPI(
    title="LLM Extraction Pipeline",
    version=__version__,
    description=(
        "Event-driven document extraction: upload PDF → OCR → Claude function calling → "
        "Pydantic-validated invoice → per-field confidence → human review queue."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_context(request: Request, call_next):  # type: ignore[no-untyped-def]
    request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
    start = time.perf_counter()
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(
        request_id=request_id,
        path=request.url.path,
        method=request.method,
    )
    try:
        response = await call_next(request)
    except Exception as exc:
        log.exception("unhandled", error=str(exc))
        return JSONResponse(
            status_code=500,
            content={"detail": "internal server error", "request_id": request_id},
        )
    elapsed_ms = (time.perf_counter() - start) * 1000
    response.headers["x-request-id"] = request_id
    response.headers["x-response-time-ms"] = f"{elapsed_ms:.1f}"
    log.info("request", status=response.status_code, elapsed_ms=round(elapsed_ms, 1))
    return response


app.include_router(health_api.router)
app.include_router(documents_api.router)
app.include_router(review_api.router)
app.include_router(eval_api.router)
