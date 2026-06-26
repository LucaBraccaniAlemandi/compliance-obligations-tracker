# Compliance Obligations Tracker — Backend

FastAPI + Pydantic + SQLAlchemy + PostgreSQL. Runs in Docker with hot-reload.

## Run

```bash
docker compose up --build
```

API at http://localhost:8000 — docs at http://localhost:8000/docs

Hot-reload: code is bind-mounted (`.:/code`) and uvicorn runs with `--reload`. Edit files locally, server reloads automatically. No rebuild needed.

## Tests

```bash
docker compose run --rm backend pytest
```

Or locally:

```bash
pip install -r requirements.txt
pytest
```
