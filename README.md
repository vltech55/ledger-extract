# LLM Extraction: Schema-Enforced Pipeline

Event-driven invoice extraction. Upload a PDF → OCR (pypdf with Tesseract
fallback) → Claude function calling against a strict Pydantic schema →
per-field confidence blended with heuristic checks → auto-approve or
route to a human review queue → Next.js dashboard for corrections →
complete audit trail.

> **Why this exists:** document extraction is one of the most-requested
> LLM use cases, yet most implementations break in production —
> hallucinated fields, missed extractions, no confidence signals, no
> human escalation path, no audit trail. This project demonstrates the
> production patterns that solve these problems.

---

## Architecture

```
            ┌─────────────────────────┐
upload PDF ─►  FastAPI                │
            │   - dedupe by SHA256    │
            │   - audit "uploaded"    │
            │   - enqueue celery task │
            └──────────┬──────────────┘
                       │
                       ▼
                 Redis broker
                       │
                       ▼
            ┌─────────────────────────┐
            │  Celery worker          │
            │   1. OCR (pypdf|tess.)  │
            │   2. Claude tool call   │
            │   3. Pydantic validate  │
            │   4. heuristic signals  │
            │   5. adjusted conf      │
            │   6. status decision    │
            │   audit each step       │
            └──────────┬──────────────┘
                       │
                       ▼
              Postgres (extractions)
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
 auto_approved                  needs_review
                                       │
                                       ▼
                         Next.js review dashboard
                          (POST /review/.../correct)
```

Full mermaid diagram and design rationale: [`docs/architecture.md`](./docs/architecture.md).

## Stack

- **API:** Python 3.11, FastAPI async, Pydantic v2 + pydantic-settings, structlog
- **Worker:** Celery 5.4 (Redis broker + result backend), `task_acks_late=True`
- **OCR:** pypdf for digital PDFs, `pdf2image` + Tesseract fallback for scans
- **LLM:** Claude `claude-sonnet-4-6` via the official `anthropic` SDK, function-calling (`tool_choice: record_invoice`)
- **Schema:** Pydantic — every top-level invoice field is wrapped in `FieldExtract[T]` carrying value + confidence + evidence
- **DB:** PostgreSQL 16, JSONB for fields + heuristic signals + audit payload, native enums for statuses
- **Frontend:** Next.js 14 App Router, Tailwind, lucide icons
- **Reliability:** Tenacity retries, content-hash dedupe on upload, `acks_late` for at-least-once delivery
- **Infra:** docker-compose with five services (postgres, redis, backend, worker, frontend)

## Quick start

```bash
cp .env.example .env
# Set ANTHROPIC_API_KEY in .env.

make up           # postgres + redis + backend + worker + frontend
make migrate      # alembic upgrade head
make seed         # generate 5 sample invoice PDFs with known ground truth
make ingest       # upload all samples to the API → Celery worker → DB

# Open the dashboard:
#   http://localhost:3001          documents
#   http://localhost:3001/queue    needs_review queue
#   http://localhost:8000/docs     OpenAPI
```

Run the regression suite (compares the current prompt against ground truth
on the bundled samples):

```bash
make regression
```

## Why per-field confidence isn't just self-reported

The hard part of production extraction is "can we trust this enough to act
on it." The system blends **two independent signals**:

1. **LLM self-confidence**: the tool schema requires `{value, confidence, evidence}` per field. Prompt v2 calibrates the scale (0.95+ = verbatim, 0.7 = inferred-unambiguous, 0.4 = guess) and enforces that `evidence` is a verbatim substring of the OCR.
2. **Heuristic signals** (independent of the LLM):
   - `subtotal + tax ≈ total` (relative tolerance 2%)
   - `sum(line_total) ≈ subtotal`
   - `due_date >= invoice_date`
   - currency in recognized ISO 4217 allowlist
   - invoice number matches an alphanumeric pattern

Adjusted confidence = `min(1, llm_conf + boost)` where `boost` grows with
the fraction of relevant signals that agree. A failing heuristic never
*lowers* confidence (that would punish noisy OCR); agreement *raises* it.

Fields below `CONFIDENCE_AUTO_APPROVE` (default 0.85) route to the review
queue. Reviewers see each field with its adjusted confidence bar, evidence
snippet, and a click-to-edit input.

## Prompt versioning & regression eval

Prompts are frozen `PromptVersion(version, system, notes)` entries in
`extract/prompts.py`. The active version is selected via `PROMPT_VERSION`
env var. Every extraction stores the version that produced it:

```sql
SELECT prompt_version, AVG(min_confidence), COUNT(*)
FROM extractions GROUP BY prompt_version;
```

`/eval/regression` runs the active prompt against the 5 bundled ground-truth
samples and reports per-field match rates. Use it before promoting a
prompt change.

## Audit trail

Every state transition writes to `audit_log`:

| entity_type | action          | actor   |
| ----------- | --------------- | ------- |
| document    | uploaded        | api     |
| document    | processing      | worker  |
| document    | extracted       | worker  |
| document    | ocr_failed      | worker  |
| document    | extract_failed  | worker  |
| extraction  | reviewed        | reviewer|

Indexed on `(entity_type, entity_id, created_at)` so a document's full
history is one query.

## Project layout

```
04-llm-extraction/
├── backend/
│   ├── src/extraction/
│   │   ├── core/            config, logging
│   │   ├── ocr/             pypdf + tesseract
│   │   ├── extract/         Invoice schema, prompts (v1, v2), LLM tool call, confidence
│   │   ├── tasks/           Celery extraction pipeline
│   │   ├── api/             documents, review, eval, health
│   │   ├── worker.py        Celery app
│   │   ├── main.py          FastAPI app
│   │   ├── models.py        documents, extractions, reviews, audit_log
│   │   └── schemas.py
│   ├── scripts/             seed_samples, ingest_samples, run_regression
│   ├── alembic/             initial migration with native enums + JSONB
│   └── tests/               invoice schema, confidence, prompts
├── frontend/
│   ├── app/                 /, /queue, /upload, /review/[id]
│   └── components/          status-badge, confidence-bar, review-form
├── docs/                    architecture (mermaid) + design rationale
├── docker-compose.yml       postgres + redis + backend + worker + frontend
└── Makefile
```

## Make targets

```
make up         start all five services
make migrate    alembic upgrade head
make seed       generate ./backend/data/samples/*.pdf + ground_truth.json
make ingest     upload every sample → enqueue extraction tasks
make regression run current prompt against ground truth; print per-file scores
make test       pytest (schema, confidence, prompts)
make lint       ruff + mypy strict
make logs       tail logs for all services
```

## What this isn't (yet)

- Object storage — uploads land on a docker volume. S3 would be a straight swap.
- Reviewer auth — `reviewer` is whatever the form supplies. Wire to OIDC.
- Distributed Celery — single broker, single concurrency=2 worker. Scale by adding worker replicas.
- Inline PDF preview — review page shows OCR text; a PDF.js viewer is a follow-up.

## License

MIT.
