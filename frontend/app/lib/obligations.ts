import 'server-only';
import { cache } from 'react';
import { apiGet } from './api';
import type { Obligation, ObligationDto } from './types';

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
    // Backend does not track a status-change history yet.
    history: [],
  };
}

export const getObligations = cache(async (): Promise<Obligation[]> => {
  const dtos = await apiGet<ObligationDto[]>('/api/obligations');
  return dtos.map(fromDto);
});

export const getObligation = cache(async (id: string): Promise<Obligation> => {
  return fromDto(await apiGet<ObligationDto>(`/api/obligations/${id}`));
});
