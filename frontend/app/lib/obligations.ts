import 'server-only';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { apiGet, ApiError } from './api';
import type {
  Obligation,
  ObligationDto,
  ObligationKpis,
  ObligationKpisDto,
  ObligationListParams,
  ObligationPage,
  ObligationPageDto,
} from './types';
import { encodeObligationParams } from './obligation-search-params';

/**
 * Read functions for obligations.
 *
 * Wrapped in `React.cache` for per-request deduplication: calling `getObligation`
 * twice in the same render (e.g. page + layout) hits the backend once.
 *
 * The backend speaks snake_case and has no notion of `history`/`hasDocument`;
 * {@link fromDto} adapts each wire record into the UI domain model.
 */

function fromDto(d: ObligationDto): Obligation {
  return {
    id: String(d.id),
    type: d.type,
    title: d.title,
    description: d.description ?? '',
    status: d.status,
    dueDate: d.due_date ?? '',
    owner: d.owner,
    requiresDocument: d.requires_document,
    hasDocument: Boolean(d.document_path),
    // Backend already masks this on read (e.g. "****6789").
    companyTaxId: d.company_tax_id,
    // Derived server-side; the UI does not recompute it.
    overdue: d.overdue,
    // Optimistic-lock version; sent back as expected_version on status changes.
    version: d.version,
    // Backend does not track a status-change history yet.
    status_history: d.status_history ?? [],
  };
}

/**
 * Read a page of obligations. The backend returns a paginated envelope
 * `{ items, total, limit, offset }` and applies the `status`/`overdue`/`title`
 * filters server-side; `total` reflects all matching rows ignoring the page.
 */
export const getObligations = cache(
  async (params: ObligationListParams = {}): Promise<ObligationPage> => {
    const qs = encodeObligationParams(params).toString();
    const dto = await apiGet<ObligationPageDto>(
      `/api/obligations${qs ? `?${qs}` : ''}`,
    );
    return {
      items: dto.items.map(fromDto),
      total: dto.total,
      limit: dto.limit,
      offset: dto.offset,
    };
  },
);

export const getObligationKpis = cache(async (): Promise<ObligationKpis> => {
  const dto = await apiGet<ObligationKpisDto>('/api/obligations/kpis');
  return {
    total: dto.total,
    byStatus: dto.by_status,
    overdue: dto.overdue,
  };
});

export const getObligation = cache(async (id: string): Promise<Obligation> => {
  return fromDto(await apiGet<ObligationDto>(`/api/obligations/${id}`));
});

/**
 * Like {@link getObligation}, but renders the not-found page when the backend
 * reports a 404 instead of bubbling the error. Lets pages read an obligation
 * with a single `await`.
 */
export async function getObligationOrNotFound(id: string): Promise<Obligation> {
  try {
    return await getObligation(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
}
