/**
 * Centralized user-facing strings (English).
 *
 * Kept in one module so a later i18n pass can swap in additional locales
 * without restructuring components.
 */

import type { ObligationStatus, ObligationType } from './types';

export const STATUS_LABELS: Record<ObligationStatus, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  submitted: 'Submitted',
  done: 'Done',
};

export const TYPE_LABELS: Record<ObligationType, string> = {
  annual_report: 'Annual report',
  franchise_tax: 'Franchise tax',
  boi_report: 'BOI report',
  registered_agent_renewal: 'Registered agent renewal',
};

/** Label shown on the transition button that moves an obligation *to* a status. */
export const TRANSITION_LABELS: Record<ObligationStatus, string> = {
  pending: 'Reopen',
  in_progress: 'Start progress',
  submitted: 'Submit',
  done: 'Mark as done',
};

export const t = {
  appName: 'Compliance Tracker',
  dashboardTitle: 'Obligations',
  create: 'Create obligation',
  loading: 'Loading…',
  retry: 'Retry',
  cancel: 'Cancel',
  back: 'Back to list',
  edit: 'Edit',
  save: 'Save',
  saving: 'Saving…',

  kpiTotal: 'Total',
  kpiPending: 'Pending',
  kpiInProgress: 'In progress',
  kpiSubmitted: 'Submitted',
  kpiDone: 'Done',
  kpiOverdue: 'Overdue',
  kpiDueSoon: 'Due soon',
  kpiAttn: 'Needs attention',

  filterStatus: 'Status',
  filterType: 'Type',
  filterAll: 'All',
  filterOverdueOnly: 'Overdue only',
  resultsShown: 'shown',

  colTitle: 'Title',
  colType: 'Type',
  colStatus: 'Status',
  colOwner: 'Owner',
  colDue: 'Due date',
  overdueTag: 'Overdue',

  emptyTitle: 'No obligations yet',
  emptyBody: 'Create your first compliance obligation to start tracking it.',
  errorTitle: "Couldn't load obligations",
  errorBody: 'Something went wrong while contacting the server.',

  detailDescription: 'Description',
  detailDocument: 'Document',
  docAttached: 'Document attached',
  docMissing: 'No document attached',
  docRequired: 'Required',
  attach: 'Attach document',
  detailOwner: 'Owner',
  detailDue: 'Due date',
  detailType: 'Type',
  detailTaxId: 'Company tax ID',
  taxidNote: 'masked',
  requiresDoc: 'Requires document',
  yes: 'Yes',
  no: 'No',

  historyTitle: 'History',
  historyEmpty: 'No status changes yet',
  actionsTitle: 'Available actions',
  actionsNote: 'Actions reflect the transitions the server reports as allowed.',
  noActions: 'No actions available for the current status.',
  submitBlockedReason:
    'A required document must be attached before this obligation can be submitted.',

  createTitle: 'Create obligation',
  editTitle: 'Edit obligation',
  fType: 'Type',
  fTitle: 'Title',
  fDescription: 'Description',
  fDue: 'Due date',
  fOwner: 'Owner',
  fRequiresDoc: 'Requires a document',
  fTaxId: 'Company tax ID',
  requiredMark: 'required',
  taxidHelp: 'Stored securely and shown masked after saving.',
  serverErrorBanner: "Couldn't save. Please review the errors below.",
} as const;
