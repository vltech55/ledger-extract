.PHONY: help up down logs build rebuild migrate seed test lint format psql redis-cli clean

help:
	@echo "Targets:"
	@echo "  up         postgres + redis + backend + worker + frontend"
	@echo "  migrate    apply alembic migrations"
	@echo "  seed       generate sample invoice PDFs in backend/data/samples/"
	@echo "  ingest     upload sample PDFs to the API to populate the queue"
	@echo "  regression run regression eval against bundled ground-truth samples"
	@echo "  test       run pytest"
	@echo "  lint       ruff + mypy"
	@echo "  format     ruff format + autofix"
	@echo "  psql       open psql"
	@echo "  redis-cli  open redis-cli"
	@echo "  logs       tail logs for all services"
	@echo "  down       stop containers"
	@echo "  clean      drop volumes"

up:
	docker compose up -d
	@echo "Backend:   http://localhost:8000/docs"
	@echo "Frontend:  http://localhost:3001"

down:
	docker compose down

logs:
	docker compose logs -f --tail=200

build:
	docker compose build

rebuild:
	docker compose build --no-cache

migrate:
	docker compose exec backend alembic upgrade head

seed:
	docker compose exec backend python -m scripts.seed_samples

ingest:
	docker compose exec backend python -m scripts.ingest_samples

regression:
	docker compose exec backend python -m scripts.run_regression

test:
	docker compose exec backend pytest -v

lint:
	docker compose exec backend ruff check src tests scripts
	docker compose exec backend mypy src

format:
	docker compose exec backend ruff format src tests scripts
	docker compose exec backend ruff check --fix src tests scripts

psql:
	docker compose exec postgres psql -U extract

redis-cli:
	docker compose exec redis redis-cli

clean:
	docker compose down -v
