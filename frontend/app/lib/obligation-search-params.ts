import type { ObligationListParams, ObligationStatus, SortDueDate } from './types';

/**
 * Shared parsing/encoding for the obligations list URL state.
 *
 * Not `server-only`: the server page parses incoming `searchParams` with
 * {@link parseObligationSearchParams}, and the client filter controls build
 * outgoing query strings with {@link encodeObligationParams} — both must agree
 * on param names and formats, so they live together here.
 */

/** Default page size; mirrors the backend default but kept explicit for the UI. */
export const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const VALID_STATUSES: readonly ObligationStatus[] = [
  'pending',
  'in_progress',
  'submitted',
  'done',
];

/** Raw shape of an awaited Next.js `searchParams` promise. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function parseInt0(value: string | string[] | undefined): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined) return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isNaN(n) ? undefined : n;
}

/**
 * Parse an awaited `searchParams` object into a normalized
 * {@link ObligationListParams}. Invalid/unknown values are dropped; `limit` and
 * `offset` are clamped to sane bounds so the UI always has usable pagination.
 */
export function parseObligationSearchParams(
  raw: RawSearchParams,
): ObligationListParams {
  const status = toArray(raw.status).filter((s): s is ObligationStatus =>
    (VALID_STATUSES as readonly string[]).includes(s),
  );

  const overdueRaw = Array.isArray(raw.overdue) ? raw.overdue[0] : raw.overdue;
  const overdue =
    overdueRaw === 'true' ? true : overdueRaw === 'false' ? false : undefined;

  const titleRaw = Array.isArray(raw.title) ? raw.title[0] : raw.title;
  const title = titleRaw?.trim() ? titleRaw.trim() : undefined;

  const limitRaw = parseInt0(raw.limit);
  const limit =
    limitRaw === undefined
      ? DEFAULT_LIMIT
      : Math.min(Math.max(limitRaw, 1), MAX_LIMIT);

  const offsetRaw = parseInt0(raw.offset);
  const offset = offsetRaw === undefined ? 0 : Math.max(offsetRaw, 0);

  // Default (`asc`) and any invalid value are dropped; only `desc` is carried.
  const sortRaw = Array.isArray(raw.sort_due_date)
    ? raw.sort_due_date[0]
    : raw.sort_due_date;
  const sortDueDate: SortDueDate | undefined = sortRaw === 'desc' ? 'desc' : undefined;

  return {
    ...(status.length > 0 ? { status } : {}),
    ...(overdue !== undefined ? { overdue } : {}),
    ...(title !== undefined ? { title } : {}),
    ...(sortDueDate !== undefined ? { sortDueDate } : {}),
    limit,
    offset,
  };
}

/**
 * Encode {@link ObligationListParams} into `URLSearchParams`. Repeats `status`,
 * emits `overdue` only when set, and omits empty `title`. `limit`/`offset` are
 * always written so links are explicit and shareable.
 */
export function encodeObligationParams(
  params: ObligationListParams,
): URLSearchParams {
  const sp = new URLSearchParams();
  for (const s of params.status ?? []) sp.append('status', s);
  if (params.overdue !== undefined) sp.set('overdue', String(params.overdue));
  if (params.title) sp.set('title', params.title);
  // Backend default is `asc`; only emit the non-default `desc`.
  if (params.sortDueDate === 'desc') sp.set('sort_due_date', 'desc');
  if (params.limit !== undefined) sp.set('limit', String(params.limit));
  if (params.offset !== undefined) sp.set('offset', String(params.offset));
  return sp;
}

/** True when any actual filter (not pagination) is active. */
export function hasActiveFilters(params: ObligationListParams): boolean {
  return (
    (params.status?.length ?? 0) > 0 ||
    params.overdue !== undefined ||
    Boolean(params.title)
  );
}
