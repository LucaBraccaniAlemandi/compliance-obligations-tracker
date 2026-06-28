/**
 * Pure domain helpers for obligations.
 *
 * No `server-only` — safe to import from Client and Server Components alike.
 *
 * Note on responsibilities: `overdue` and the masked tax id are computed by the
 * backend (see `ObligationDto`), and transition rules (including the
 * document-required block) are enforced server-side, which returns an error
 * when violated. The UI does not re-derive any of that here.
 */

import type { ObligationStatus } from './types';

/**
 * Statuses an obligation can move to from its current status.
 *
 * Mirrors the backend state machine purely to decide which action buttons to
 * render; the backend remains the source of truth and rejects invalid moves.
 */
const TRANSITION_MAP: Record<ObligationStatus, ObligationStatus[]> = {
  pending: ['in_progress'],
  in_progress: ['submitted', 'pending'],
  submitted: ['done', 'in_progress'],
  done: [],
};

export function allowedTransitions(status: ObligationStatus): ObligationStatus[] {
  return TRANSITION_MAP[status] ?? [];
}

/** Maps a status to a shadcn Badge variant. */
export function statusBadgeVariant(
  status: ObligationStatus,
): 'secondary' | 'default' | 'outline' {
  switch (status) {
    case 'pending':
      return 'secondary';
    case 'in_progress':
      return 'secondary';
    case 'submitted':
      return 'outline';
    case 'done':
      return 'default';
  }
}
