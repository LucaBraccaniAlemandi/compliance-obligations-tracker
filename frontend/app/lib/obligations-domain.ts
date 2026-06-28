/**
 * Pure domain helpers for obligations.
 *
 * No `server-only` — safe to import from Client and Server Components alike.
 * All functions are side-effect free so they can be unit tested directly.
 */

import type { Obligation, ObligationStatus } from './types';

/** Allowed status transitions, mirroring the backend state machine. */
const TRANSITION_MAP: Record<ObligationStatus, ObligationStatus[]> = {
  pending: ['in_progress'],
  in_progress: ['submitted', 'pending'],
  submitted: ['done', 'in_progress'],
  done: [],
};

const ACTIVE_STATUSES: ReadonlySet<ObligationStatus> = new Set<ObligationStatus>(
  ['pending', 'in_progress'],
);

const DUE_SOON_DAYS = 21;
const MS_PER_DAY = 86_400_000;

/** Statuses an obligation can move to from its current status. */
export function allowedTransitions(status: ObligationStatus): ObligationStatus[] {
  return TRANSITION_MAP[status] ?? [];
}

function startOfToday(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00`);
}

/** True when the obligation is past due and still actionable. */
export function isOverdue(o: Obligation, now?: Date): boolean {
  if (!ACTIVE_STATUSES.has(o.status)) return false;
  return parseDate(o.dueDate) < startOfToday(now);
}

/** True when active and due within the next {@link DUE_SOON_DAYS} days. */
export function isDueSoon(o: Obligation, now?: Date): boolean {
  if (!ACTIVE_STATUSES.has(o.status) || isOverdue(o, now)) return false;
  const days = (parseDate(o.dueDate).getTime() - startOfToday(now).getTime()) / MS_PER_DAY;
  return days >= 0 && days <= DUE_SOON_DAYS;
}

/**
 * A `submitted` transition is blocked while a required document is missing.
 * Returns the human-readable reason, or `null` when the transition is allowed.
 */
export function transitionBlockedReason(
  o: Obligation,
  to: ObligationStatus,
): string | null {
  if (to === 'submitted' && o.requiresDocument && !o.hasDocument) {
    return 'A required document must be attached before this obligation can be submitted.';
  }
  return null;
}

export function isTransitionBlocked(o: Obligation, to: ObligationStatus): boolean {
  return transitionBlockedReason(o, to) !== null;
}

/** Masks a tax id to `••••<last4>`, hiding all but the trailing four digits. */
export function maskTaxId(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  const last4 = digits.slice(-4) || '0000';
  return `••••${last4}`;
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
