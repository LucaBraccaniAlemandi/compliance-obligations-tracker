/**
 * English dictionary — the source of truth for the set of keys every locale
 * must provide. `Dictionary` is derived from this object, so adding a key here
 * makes it required in every other locale file.
 */

import type { ObligationStatus, ObligationType } from '../types';

const STATUS_LABELS: Record<ObligationStatus, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  submitted: 'Submitted',
  done: 'Done',
};

const TYPE_LABELS: Record<ObligationType, string> = {
  annual_report: 'Annual report',
  franchise_tax: 'Franchise tax',
  boi_report: 'BOI report',
  registered_agent_renewal: 'Registered agent renewal',
};

/** Label shown on the transition button that moves an obligation *to* a status. */
const TRANSITION_LABELS: Record<ObligationStatus, string> = {
  pending: 'Reopen',
  in_progress: 'Start progress',
  submitted: 'Submit',
  done: 'Mark as done',
};

const t = {
  appName: 'Compliance Tracker',
  dashboardTitle: 'Obligations',
  create: 'Create obligation',
  loading: 'Loading…',
  retry: 'Retry',
  cancel: 'Cancel',
  back: 'Back to list',
  edit: 'Edit',
  delete: 'Delete',
  deleting: 'Deleting…',
  deleteConfirm: 'Delete this obligation? This cannot be undone.',
  save: 'Save',
  saving: 'Saving…',
  language: 'Language',

  kpiTotal: 'Total',
  kpiPending: 'Pending',
  kpiInProgress: 'In progress',
  kpiSubmitted: 'Submitted',
  kpiDone: 'Done',
  kpiOverdue: 'Overdue',
  kpiDueSoon: 'Due soon',
  kpiAttn: 'Needs attention',

  filterStatus: 'Status',
  filterOverdue: 'Overdue',
  filterAll: 'All',
  filterTitle: 'Title',
  filterTitlePlaceholder: 'Search title…',
  filterClear: 'Clear filters',
  sortAsc: 'Sort by earliest due date',
  sortDesc: 'Sort by latest due date',
  overdueAll: 'All',
  overdueOnly: 'Overdue',
  overdueNot: 'Not overdue',
  noMatchTitle: 'No matching obligations',
  noMatchBody: 'No obligations match the current filters.',
  paginationPrev: 'Previous',
  paginationNext: 'Next',
  rangeOf: 'of',

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
  taxidLocked: "Tax ID can't be changed after creation.",
  serverErrorBanner: "Couldn't save. Please review the errors below.",
  toastCreated: 'Obligation created.',
  toastUpdated: 'Obligation updated.',
  toastSaveError: "Couldn't save. Please review the errors below.",
  toastStatusUpdated: 'Status updated.',
  toastConcurrentModification:
    'This obligation was changed by someone else. Showing the latest version — review and retry.',
  toastDocAttached: 'Document attached.',
  toastActionFailed: 'Action failed.',
  toastDeleted: 'Obligation deleted.',

  // Form validation messages (shared by client + server validation).
  vTitleRequired: 'Title is required.',
  vDueRequired: 'Due date is required.',
  vDueInvalid: 'Enter a valid date.',
  vOwnerRequired: 'Owner is required.',
  vTaxIdRequired: 'Tax ID is required.',
  vTaxIdFormat: 'Use the format 12-3456789.',
  validationFailed: 'Validation failed.',

  // Backend error-code messages. `{from}`/`{to}`/`{status}` are interpolated.
  errValidation: 'Please check the highlighted fields and try again.',
  errNotFound: 'This obligation no longer exists. It may have been deleted.',
  errInvalidTransition: "Can't move this obligation from {from} to {to}.",
  errDocumentRequired:
    'A required document must be attached before this obligation can be submitted.',
  errHttp: 'The server rejected this request ({status}).',
  errInternal: 'The server hit an unexpected error. Please try again.',
  errGeneric: 'Something went wrong. Please try again.',
  errBackend: 'Backend error ({status}).',
};

export const en = { STATUS_LABELS, TYPE_LABELS, TRANSITION_LABELS, t };

/** Shape every locale must implement. Derived from the English dictionary. */
export type Dictionary = typeof en;
