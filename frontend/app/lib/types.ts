/**
 * Backend domain types for compliance obligations.
 *
 * Shapes mirror the "Compliance Tracker" design contract. Kept in one place so
 * the api client, server actions, and UI share a single source of truth.
 */

export type ObligationType =
  | 'annual_report'
  | 'franchise_tax'
  | 'boi_report'
  | 'registered_agent_renewal';

export type ObligationStatus = 'pending' | 'in_progress' | 'submitted' | 'done';

/** One entry in an obligation's status-change audit trail. */
export interface StatusChange {
  from: ObligationStatus;
  to: ObligationStatus;
  /** ISO 8601 datetime string. */
  at: string;
}

export interface Obligation {
  id: string;
  type: ObligationType;
  title: string;
  description: string;
  status: ObligationStatus;
  /** ISO 8601 date string (YYYY-MM-DD). */
  dueDate: string;
  owner: string;
  requiresDocument: boolean;
  hasDocument: boolean;
  /** Raw tax id; never render unmasked — see `maskTaxId`. */
  companyTaxId: string;
  history: StatusChange[];
}

/** Field-level validation errors keyed by form field name. */
export type FieldErrors = Partial<Record<string, string>>;

/** Result returned by mutating server actions, consumed via `useActionState`. */
export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: FieldErrors };
