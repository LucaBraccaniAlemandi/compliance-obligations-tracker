# DECISIONS

Rationale, trade-offs, and where AI helped vs. where it was steered. Written to
be defended.

## 1. Architecture

### Backend — domain isolated from HTTP and from the DB

Layers, outermost to innermost:

- **Routes** (`app/routes/obligations.py`) — HTTP only: parse request, call the
  domain, map the result/error to a response. No business rule lives here.
- **Domain / services** (`app/services/obligation_status.py`) — the state
  machine, the document-gated invariant, and the audit-trail write. Pure logic
  over model objects; knows nothing about FastAPI or sessions.
- **Models / data access** (`app/models/`) — SQLAlchemy entities, the optimistic
  `version` column, the `status_history` relationship.
- **Schemas** (`app/schemas/`) — Pydantic request/response contracts, split into
  `requests` / `responses` / `base` so the write surface and read surface evolve
  independently (e.g. `status` and `companyTaxId` are not editable via update).

The key move: `ObligationStatusService.apply()` mutates the obligation and
appends history **without touching the session**. The route owns the
commit/rollback. So the rule is unit-testable with a plain object, and the same
rule cannot be bypassed by any caller — there is no second code path.

**Why this split:** the rubric weighs "the rule does not go in the handler."
Keeping `apply()` HTTP- and DB-agnostic means the state machine has exactly one
home and the tests prove behavior, not plumbing.

**Discarded — repository / unit-of-work layer.** Routes commit directly against
the session. A dedicated repository layer for DB access was considered and left
out to keep the design simple at this scope: the data access is thin and there
is one entity. If this grows (more entities, shared query logic, multiple
backends), the seam is obvious — introduce repositories behind the services and
the domain code is untouched because `apply()` already never speaks to the
session.

**The service layer _is_ the domain layer.** Domain logic is not a separate
package; `ObligationStatusService` is the domain layer, operating directly on the
SQLAlchemy model. No standalone entities / value objects distinct from the ORM
model — at this scope that would be ceremony for one entity with no rich value
objects. The isolation that matters is still there: the service holds the rules,
out of the handler, and never touches the session, so it is testable without
HTTP or a live DB. Splitting domain entities away from the ORM model is the next
seam if the model grows richer.

### Frontend — features + server/client boundary

- **Server Components by default**; data fetched server-side via a `server-only`
  API client (`app/lib/api.ts`) so the backend URL and the raw responses never
  reach the browser.
- **Server Actions** for mutations (`app/lib/actions.ts`).
- **Domain not duplicated:** `obligations-domain.ts` mirrors the transition map
  *only* to decide which buttons to render; the backend stays the source of
  truth and rejects invalid moves. `overdue` and the masked tax id come straight
  from the API — the UI never re-derives them.
- **UI primitives** (`components/ui/`) are reusable shadcn-style components;
  feature components live under `app/[lang]/obligations/`.
- **i18n** es/en via `[lang]` segment + dictionaries; error `code`s from the
  backend map to translated messages on the client.

**Why mirror transitions at all if the backend is authoritative?** To avoid
rendering buttons that will only 409. It is a UX affordance, not a rule — the
block (e.g. submitted-without-document) is still enforced server-side and
surfaced as an error.

Scope cuts (what was left out and why) and the roadmap are consolidated in §5.

## 2. API contract

Base path `/obligations`. Live OpenAPI at `http://localhost:8000/docs` (the
authoritative contract — this table is the summary).

| Method | Path | Request body | Success | Errors |
|---|---|---|---|---|
| POST | `/obligations` | `ObligationCreate` | `201` `ObligationRead` | `422` |
| GET | `/obligations` | — (query: `status[]`, `overdue`, `title`, `limit`, `offset`) | `200` `LimitOffsetPage<ObligationRead>` | `422` |
| GET | `/obligations/kpis` | — | `200` `ObligationKpis` | — |
| GET | `/obligations/{id}` | — | `200` `ObligationDetailRead` | `404` |
| PATCH | `/obligations/{id}` | `ObligationUpdate` (partial) | `200` `ObligationRead` | `404`, `422` |
| PATCH | `/obligations/{id}/status` | `ObligationStatusUpdate` | `200` `ObligationRead` | `404`, `409`, `422` |
| DELETE | `/obligations/{id}` | — | `204` | `404` |

### Payloads

Wire format is `snake_case` (no camelCase alias generator — the JSON matches the
Python fields).

- **`ObligationCreate`** — `type`, `title`, `owner` (required), `description?`,
  `due_date?`, `requires_document` (default `false`), `document_path?`,
  `company_tax_id` (required, stored full).
- **`ObligationUpdate`** — all of the above optional, **except** `status` and
  `company_tax_id` are not editable here. Status moves only through the dedicated
  endpoint (so it always runs the state machine); the tax id is write-once on
  create.
- **`ObligationStatusUpdate`** — `status` (target) + optional `expected_version`
  (optimistic-lock precondition).
- **`ObligationRead`** — entity + derived `overdue`, `version`, and
  `company_tax_id` **masked** (`****6789`). **`ObligationDetailRead`** adds
  `status_history[]` (`from_status`, `to_status`, `changed_at`).
- **`ObligationKpis`** — `total`, `by_status` (count per status), `overdue`.

### Error envelope

Every error returns one shape — a machine `code` plus `params`, never
human prose, so the client owns translation (i18n):

```json
{ "error": { "code": "INVALID_STATUS_TRANSITION", "params": { "current": "pending", "target": "done" } } }
```

| Code | HTTP | When |
|---|---|---|
| `NOT_FOUND` | 404 | unknown id |
| `INVALID_STATUS_TRANSITION` | 409 | move not allowed by the state machine |
| `DOCUMENT_REQUIRED` | 409 | → `submitted` while `requiresDocument` and no document |
| `CONCURRENT_MODIFICATION` | 409 | `expectedVersion` ≠ current, or stale write at commit |
| `VALIDATION_ERROR` | 422 | request validation (per-field `type`s in `params.fields`) |
| `HTTP_ERROR` / `INTERNAL_ERROR` | 4xx / 500 | routing / unexpected |

**Why `409` for invalid transition & document-gated** (not `422`): the request
is well-formed; it conflicts with current server *state*. `422` is reserved for
malformed input. This lets the client tell "you sent garbage" from "the world
changed under you."

## 3. Key decisions — overdue, concurrency, sensitive data

### `overdue` — derived, never stored

`overdue` is a computed field, not a column and not a status. Definition:
`due_date` has passed **and** status is not `submitted`/`done`.

**Status gates it — only `pending` and `in_progress` can be overdue.** Once an
obligation is `submitted` or `done` it counts as *closed*: the work is in, so a
past `due_date` is no longer a problem and `overdue` is `false`. So a `submitted`
or `done` obligation never shows as overdue and never matches the `overdue=true`
list filter or the KPI count — even with a `due_date` long past. Overdue means
"still open and late," not merely "late." This holds identically in both the read
model and the SQL filter (they share the predicate), so a closed obligation can't
appear overdue through one path and not the other.

It lives in two places that are kept deliberately in sync:

- **Read model** — `ObligationRead.overdue` (`@computed_field` in
  `schemas/responses.py`) derives it per row for API responses.
- **Queries** — `_overdue_conditions()` in `routes/obligations.py` expresses the
  same predicate in SQL, used by the `overdue` list filter and the KPI count.

**Why derived:** a stored "overdue" flag is wrong the moment a date passes with
no write — it would need a cron/sweeper to stay true, and could drift from
reality. Deriving from `due_date` + `status` is always correct at read time, no
background job. **Why duplicated in SQL:** computing it in Python would force
loading every row to filter/count overdue; the SQL predicate keeps filtering and
KPIs at the DB. The risk is the two definitions diverging — they carry comments
pointing at each other, and the behavior is covered by tests.

### Concurrency — optimistic locking

Two requests changing the same obligation's status at once must not silently
clobber each other. Solution: an integer `version` column with SQLAlchemy's
`version_id_col`. Two layers of defense:

1. **Client precondition** — `expected_version` in the status request. If it
   doesn't match the current row, reject early with `409
   CONCURRENT_MODIFICATION` before doing any work. Handles the stale-view case.
2. **DB backstop** — on commit, SQLAlchemy adds `WHERE version = :old` and bumps
   it. If a concurrent writer already moved the row, the UPDATE matches 0 rows →
   `StaleDataError`, which the route rolls back and maps to the same `409`.

**Why optimistic, not locking:** contention is low (a human changing one
obligation), so pessimistic row locks would add cost for a rare collision.
Optimistic locking is lock-free on the happy path and turns the rare race into a
clean, retryable `409` instead of a lost update. The client gets back the
current `version` to retry.

### Sensitive data — `company_tax_id`

Three rules: **stored full, returned masked, never logged.**

- **Stored full** — the column holds the complete value (needed for the real
  filing); masking is a read-time concern, not a storage one.
- **Typed as `VARCHAR(64)`, not numeric** — a tax id is an identifier, not a
  number: format varies (EIN `12-3456789`, dashes, leading zeros, jurisdiction
  differences) and is never arithmetic. A string preserves the exact value as
  entered, keeps leading zeros, and doesn't impose a shape the domain doesn't
  own; `64` is generous headroom for any of these formats.
- **Returned masked** — `ObligationRead` has a `field_serializer` that renders
  `****<last4>`. Masking is in the response schema, so *every* read path is
  masked by construction — a route can't accidentally leak the raw value, and
  there's no "unmasked" read endpoint.
- **Write-once** — not editable via `ObligationUpdate`; only accepted on create.
  Less surface area for the raw value to move around.
- **Out of logs** — the value is never logged. The error envelope carries only
  machine `code` + structured `params` (ids, statuses, versions), never request
  bodies, so the tax id can't ride into logs through an error path.

## 4. AI usage — where it helped, where it was steered

AI was used throughout, as expected. The honest framing: most of the value was
**direction**, not delegation — I drove the design (the layering, where each rule
lives, the contract) and used AI to execute that plan fast, then corrected it
when its default instinct didn't match the intent. Work went in vertical slices,
one PR per feature, backend rule first then the front wired to it (see the PR
history) — so each rule had a home and tests before the UI touched it.

Where it helped:

- Scaffolding the layered structure, Pydantic schemas, SQLAlchemy models, and the
  Alembic setup quickly once I'd decided the shape.
- Boilerplate-heavy slices: the KPI endpoint, list filters + pagination, the
  i18n locale routing and dictionaries.

Where I corrected / steered it (concrete):

- **Form lost input on error** (PR #14) — the first version reset the obligation
  form on a failed submit, throwing away what the user typed. I had it preserve
  the input on error and require `company_tax_id` on create instead. UX +
  invariant, not what the AI reached for by default.
- **Single-file sprawl → modules** (PR #15) — schemas, enums, and exceptions
  started piling into single files; I split them into modules
  (`requests`/`responses`/`base`, `enums`, `exceptions`) so the read vs. write
  surfaces stay separate. A structure call, not a feature.
- **Domain out of the handler** — the natural AI default is to put rule checks
  inline in the route. I steered the state machine + document-gated invariant
  into `ObligationStatusService`, with the route owning only commit/rollback, so
  there's a single enforced path.

## 5. Scope — left out on purpose & with more time

The scope is small by design. These cuts are deliberate, and each is positioned
so the deferred piece can be added later without disturbing a domain rule.

### Left out on purpose

- **Real document upload** — `requiresDocument` and the document-gated invariant
  are fully enforced server-side; the attachment itself is a mock path. The
  state-machine rule is what mattered — storing bytes is plumbing, and adding it
  later doesn't touch the rule.
- **Auth** — not a missing checkbox. Real auth would pull in domain logic this
  scope doesn't ask for: to matter it needs ownership of obligations (which user
  owns which) or roles/groups gating who can see/act on a given obligation. That
  is meaningful extra modeling, so it was deliberately deferred rather than
  stubbed. Single-tenant, no users/roles for now.
- **Structured / observability logging** — sensitive-data masking is in place
  (the tax id can't ride into logs via the error envelope); a full
  structured-logging setup was deferred.
- **Pixel-perfect UI** — functional dashboard, detail, and forms with basic a11y;
  not a design pass.

### With more time

- Real document storage (object storage + signed URLs) and document-level audit.
- Reminders for upcoming deadlines, plus richer search/pagination on the front.
- CI running lint + tests on both layers.
- Structured logs + request tracing, with explicit redaction of `company_tax_id`.
- Auth + multi-tenant scoping.
