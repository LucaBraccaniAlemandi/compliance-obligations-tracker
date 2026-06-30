# Compliance Obligations Tracker

Accountability & compliance tracker for founders: keep a company's regulatory
obligations (filings, deadlines, documentation) from slipping through the cracks.
A high-care domain — a miscalculated date, a leaked sensitive field, or an
unrecorded change is an expensive mistake — so the rules live in the backend and
are treated as inviolable.

> See [`DECISIONS.md`](./DECISIONS.md) for the architecture rationale, API
> contract, trade-offs, and where AI helped vs. where it was corrected.

## What this does

An obligation has: `type` (`annual_report | franchise_tax | boi_report |
registered_agent_renewal`), `title`, `description`, `status`, `dueDate`,
`owner` (required), `requiresDocument` + optional attached document, and
`companyTaxId` (sensitive).

### Domain rules (enforced server-side, in an isolated domain layer)

- **State machine** — single source of truth in the backend
  (`app/services/obligation_status.py`):
  - `pending → in_progress`
  - `in_progress → submitted | pending`
  - `submitted → done | in_progress` (reject / rework)
  - `done → in_progress` (reopen)
  - Invalid transitions are rejected by the API and never persisted.
- **Document-gated invariant** — if `requiresDocument`, the obligation cannot
  move to `submitted` without an attached document. Backend rule, not a form check.
- **`overdue` is derived, not a stored state** — `dueDate` passed and status is
  not `submitted`/`done`.
- **Sensitive data** — `companyTaxId` is stored in full, returned masked
  (`****6789`), and never logged.
- **Audit trail** — every status change is recorded (from → to, when). The
  detail view shows the history.
- **Concurrency** — optimistic locking via a `version` column
  (`version_id_col`). Clients send `expected_version`; a stale write loses with a
  `409 Conflict` instead of silently overwriting.

## Architecture

**Backend** (`backend/`) — FastAPI + Pydantic + SQLAlchemy + Alembic, PostgreSQL.
Layered: routes (HTTP) → services (domain: state machine, invariant, audit) →
models / data access. The rule does **not** live in the handler.

**Frontend** (`frontend/`) — Next.js (App Router) + React + TypeScript strict +
Tailwind. Server Components by default, Server Actions for mutations. Valid
transitions and the document-gated block come from the backend — the domain is
not duplicated in the front. `i18n` es/en. A server-only proxy keeps the backend
URL off the browser.

## Requirements

- Docker + Docker Compose (backend + Postgres)
- Node.js 20+ (frontend)

## Run it

### 1. Backend + database (Docker)

```bash
cd backend
cp .env.example .env
docker compose up --build
```

This starts Postgres, runs Alembic migrations (`alembic upgrade head`), and
serves the API with `--reload`.

- API: http://localhost:8000
- OpenAPI docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local   # BACKEND_API_URL=http://localhost:8000
npm install
npm run dev
```

App: http://localhost:3000 (redirects to a localized route, e.g. `/en` or `/es`).

## API (summary)

| Method | Path                          | Purpose                                   |
|--------|-------------------------------|-------------------------------------------|
| POST   | `/obligations`                | Create                                    |
| GET    | `/obligations`                | List (filters: `status`, `overdue`, `title`; limit/offset paginated) |
| GET    | `/obligations/kpis`           | Totals: total, by status, overdue         |
| GET    | `/obligations/{id}`           | Detail (+ status history)                 |
| PATCH  | `/obligations/{id}`           | Edit fields                               |
| PATCH  | `/obligations/{id}/status`    | Change status (state machine + invariant; `expected_version`) |
| DELETE | `/obligations/{id}`           | Delete                                    |

Consistent error model — every error returns `{ "error": { "code", "params" } }`
(the backend sends a machine `code` for the client to translate, never prose):
`404` not found, `409` invalid transition / missing required document / concurrent
modification, `422` request validation.

## Tests

Behavior tests on both layers.

Backend (run inside the container):

```bash
docker compose exec backend pytest
```

Frontend (Playwright):

```bash
cd frontend
npm run test:e2e
```

Lint / types (frontend):

```bash
npm run lint
npm run typecheck
```
