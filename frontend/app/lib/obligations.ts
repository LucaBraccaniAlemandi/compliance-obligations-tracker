import 'server-only';
import { cache } from 'react';
import { apiGet } from './api';
import type { Obligation } from './types';

/**
 * Read functions for obligations.
 *
 * Wrapped in `React.cache` for per-request deduplication: calling `getObligation`
 * twice in the same render (e.g. page + layout) hits the backend once.
 */

export const getObligations = cache((): Promise<Obligation[]> => {
  return apiGet<Obligation[]>('/api/obligations');
});

export const getObligation = cache((id: string): Promise<Obligation> => {
  return apiGet<Obligation>(`/api/obligations/${id}`);
});
