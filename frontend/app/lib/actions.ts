'use server';

import { revalidatePath } from 'next/cache';
import { apiPost, apiPatch, apiDelete, ApiError } from './api';
import {
  obligationFormSchema,
  readObligationForm,
  type ObligationFormValues,
} from './validation';
import type {
  ActionResult,
  FieldErrors,
  ObligationDto,
  ObligationStatus,
} from './types';

/**
 * Server Actions for mutating obligations on the separate FastAPI backend.
 *
 * Reachable via direct POST, not only through the UI, so every action
 * re-validates its input here. When auth lands, validate the session at the top
 * of every action before touching the backend.
 *
 * The backend contract is snake_case and splits concerns across routes:
 *   - POST   /api/obligations            create (accepts company_tax_id)
 *   - PATCH  /api/obligations/:id         edit fields (NOT status / tax id)
 *   - PATCH  /api/obligations/:id/status  status transitions only
 * The mappers below translate the camelCase form values to that wire shape.
 */

function validateForm(
  formData: FormData,
): { ok: true; data: ObligationFormValues } | { ok: false; fieldErrors: FieldErrors } {
  const parsed = obligationFormSchema.safeParse(readObligationForm(formData));
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }
  const fieldErrors: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { ok: false, fieldErrors };
}

/** Fields the backend accepts on both create and edit (snake_case). */
function toEditablePayload(d: ObligationFormValues) {
  return {
    type: d.type,
    title: d.title,
    description: d.description,
    due_date: d.dueDate,
    owner: d.owner,
    requires_document: d.requiresDocument,
  };
}

export async function createObligation(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const result = validateForm(formData);
  if (!result.ok) {
    return { ok: false, error: 'Validation failed.', fieldErrors: result.fieldErrors };
  }
  try {
    // company_tax_id is only accepted on create.
    await apiPost<ObligationDto>('/api/obligations', {
      ...toEditablePayload(result.data),
      company_tax_id: result.data.companyTaxId,
    });
    revalidatePath('/obligations');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toMessage(err) };
  }
}

export async function updateObligation(
  id: string,
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const result = validateForm(formData);
  if (!result.ok) {
    return { ok: false, error: 'Validation failed.', fieldErrors: result.fieldErrors };
  }
  try {
    // PATCH (not PUT); status and company_tax_id are not editable here.
    await apiPatch<ObligationDto>(`/api/obligations/${id}`, toEditablePayload(result.data));
    revalidatePath('/obligations');
    revalidatePath(`/obligations/${id}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toMessage(err) };
  }
}

export async function transitionObligation(
  id: string,
  to: ObligationStatus,
): Promise<ActionResult> {
  try {
    // Dedicated transition route enforces the backend state machine.
    await apiPatch<ObligationDto>(`/api/obligations/${id}/status`, { status: to });
    revalidatePath('/obligations');
    revalidatePath(`/obligations/${id}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toMessage(err) };
  }
}

export async function attachDocument(id: string): Promise<ActionResult> {
  try {
    // Backend models the document as a nullable path, not a boolean.
    await apiPatch<ObligationDto>(`/api/obligations/${id}`, {
      document_path: `${id}.pdf`,
    });
    revalidatePath(`/obligations/${id}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toMessage(err) };
  }
}

export async function deleteObligation(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get('id') ?? '');
  try {
    await apiDelete(`/api/obligations/${id}`);
    revalidatePath('/obligations');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toMessage(err) };
  }
}

/** Backend error envelope: `{ "error": { "code", "params" } }`. */
type ErrorEnvelope = {
  error?: { code?: string; params?: Record<string, unknown> };
};

const STATUS_TEXT: Record<string, string> = {
  pending: 'pending',
  in_progress: 'in progress',
  submitted: 'submitted',
  done: 'done',
};

function statusText(v: unknown): string {
  return STATUS_TEXT[String(v)] ?? String(v);
}

/**
 * Maps a backend error envelope to a friendly message, interpolating `params`.
 * The backend sends no human text — only a machine `code` + structured params.
 */
function messageForCode(code: string, params: Record<string, unknown>): string {
  switch (code) {
    case 'VALIDATION_ERROR':
      return 'Please check the highlighted fields and try again.';
    case 'NOT_FOUND':
      return 'This obligation no longer exists. It may have been deleted.';
    case 'INVALID_STATUS_TRANSITION':
      return `Can't move this obligation from ${statusText(params.current)} to ${statusText(params.target)}.`;
    case 'DOCUMENT_REQUIRED':
      return 'A required document must be attached before this obligation can be submitted.';
    case 'HTTP_ERROR':
      return `The server rejected this request (${params.status ?? 'error'}).`;
    case 'INTERNAL_ERROR':
      return 'The server hit an unexpected error. Please try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

function toMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const envelope = err.body as ErrorEnvelope;
    const code = envelope?.error?.code;
    if (code) return messageForCode(code, envelope.error?.params ?? {});
    return `Backend error (${err.status}).`;
  }
  return 'Something went wrong. Please try again.';
}
