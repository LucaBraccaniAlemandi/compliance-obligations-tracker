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
  from_status: ObligationStatus;
  to_status: ObligationStatus;
  /** ISO 8601 datetime string. */
  changed_at: string;
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
  /** Already masked by the backend (e.g. "****6789"); render as-is. */
  companyTaxId: string;
  /** Derived and supplied by the backend — not recomputed client-side. */
  overdue: boolean;
  /** Optimistic-lock version; echoed back as `expected_version` on status PATCH. */
  version: number;
  status_history: StatusChange[];
}

/**
 * Wire shape returned/accepted by the FastAPI backend (snake_case).
 * Kept separate from the UI domain {@link Obligation}; map via the adapters in
 * `obligations.ts` / `actions.ts`. The backend has no `history`, exposes
 * documents as a nullable `document_path`, masks `company_tax_id` on read, and
 * uses integer ids.
 */
export interface ObligationDto {
  id: number;
  type: ObligationType;
  title: string;
  description: string | null;
  status: ObligationStatus;
  due_date: string | null;
  owner: string;
  requires_document: boolean;
  document_path: string | null;
  company_tax_id: string;
  created_at: string;
  overdue: boolean;
  /** Optimistic-lock version, bumped on every mutation. */
  version: number;
  status_history: StatusChange[];
}

/** Field-level validation errors keyed by form field name. */
export type FieldErrors = Partial<Record<string, string>>;

/** Result returned by mutating server actions, consumed via `useActionState`. */
export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: FieldErrors };
