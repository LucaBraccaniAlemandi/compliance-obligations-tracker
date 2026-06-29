'use server';

import { revalidatePath } from 'next/cache';
import { apiPost, apiPatch, apiDelete, ApiError } from './api';
import { getObligation } from './obligations';
import { getRequestDictionary } from './dictionaries/server';
import type { Dictionary } from './dictionaries/en';
import {
  buildObligationFormSchema,
  validationMessages,
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
  dict: Dictionary,
): { ok: true; data: ObligationFormValues } | { ok: false; fieldErrors: FieldErrors } {
  const schema = buildObligationFormSchema(validationMessages(dict.t));
  const parsed = schema.safeParse(readObligationForm(formData));
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
  const dict = await getRequestDictionary();
  const result = validateForm(formData, dict);
  if (!result.ok) {
    return { ok: false, error: dict.t.validationFailed, fieldErrors: result.fieldErrors };
  }
  try {
    // company_tax_id is only accepted on create.
    await apiPost<ObligationDto>('/api/obligations', {
      ...toEditablePayload(result.data),
      company_tax_id: result.data.companyTaxId,
    });
    // Routes are nested under `[lang]`; revalidate every locale variant.
    revalidatePath('/[lang]/obligations', 'page');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toMessage(err, dict) };
  }
}

export async function updateObligation(
  id: string,
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const dict = await getRequestDictionary();
  const result = validateForm(formData, dict);
  if (!result.ok) {
    return { ok: false, error: dict.t.validationFailed, fieldErrors: result.fieldErrors };
  }
  try {
    // PATCH (not PUT); status and company_tax_id are not editable here.
    await apiPatch<ObligationDto>(`/api/obligations/${id}`, toEditablePayload(result.data));
    // Routes are nested under `[lang]`; revalidate every locale variant.
    revalidatePath('/[lang]/obligations', 'page');
    revalidatePath('/[lang]/obligations/[id]', 'page');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toMessage(err, dict) };
  }
}

/**
 * Result of a status transition. Carries the fresh `status`/`version` on success
 * (so the next change can send an up-to-date `expected_version`) and also on a
 * `CONCURRENT_MODIFICATION` conflict (so the UI can show the latest state before
 * the user retries — we never auto-retry).
 */
export type TransitionResult =
  | { ok: true; status: ObligationStatus; version: number }
  | {
      ok: false;
      code: 'CONCURRENT_MODIFICATION';
      error: string;
      status: ObligationStatus;
      version: number;
    }
  | { ok: false; error: string };

export async function transitionObligation(
  id: string,
  to: ObligationStatus,
  expectedVersion: number,
): Promise<TransitionResult> {
  const dict = await getRequestDictionary();
  try {
    // Dedicated transition route enforces the backend state machine.
    // expected_version lets the backend reject changes made against stale reads.
    const dto = await apiPatch<ObligationDto>(`/api/obligations/${id}/status`, {
      status: to,
      expected_version: expectedVersion,
    });
    // Routes are nested under `[lang]`; revalidate every locale variant.
    revalidatePath('/[lang]/obligations', 'page');
    revalidatePath('/[lang]/obligations/[id]', 'page');
    return { ok: true, status: dto.status, version: dto.version };
  } catch (err) {
    // A version conflict: refetch so the UI can show who-won state, then let the
    // user decide whether to retry against the fresh version.
    if (err instanceof ApiError && err.status === 409) {
      const envelope = err.body as ErrorEnvelope;
      if (envelope?.error?.code === 'CONCURRENT_MODIFICATION') {
        const fresh = await getObligation(id);
        revalidatePath('/[lang]/obligations/[id]', 'page');
        return {
          ok: false,
          code: 'CONCURRENT_MODIFICATION',
          error: messageForCode('CONCURRENT_MODIFICATION', envelope.error?.params ?? {}, dict),
          status: fresh.status,
          version: fresh.version,
        };
      }
    }
    return { ok: false, error: toMessage(err, dict) };
  }
}

export async function attachDocument(id: string): Promise<ActionResult> {
  const dict = await getRequestDictionary();
  try {
    // Backend models the document as a nullable path, not a boolean.
    await apiPatch<ObligationDto>(`/api/obligations/${id}`, {
      document_path: `${id}.pdf`,
    });
    revalidatePath('/[lang]/obligations/[id]', 'page');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toMessage(err, dict) };
  }
}

export async function deleteObligation(formData: FormData): Promise<ActionResult> {
  const dict = await getRequestDictionary();
  const id = String(formData.get('id') ?? '');
  try {
    await apiDelete(`/api/obligations/${id}`);
    // Routes are nested under `[lang]`; revalidate every locale variant.
    revalidatePath('/[lang]/obligations', 'page');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toMessage(err, dict) };
  }
}

/** Backend error envelope: `{ "error": { "code", "params" } }`. */
type ErrorEnvelope = {
  error?: { code?: string; params?: Record<string, unknown> };
};

/** Replaces `{key}` placeholders in a message template with `vars[key]`. */
function interpolate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

/** Localized status label for interpolation; falls back to the raw value. */
function statusText(dict: Dictionary, v: unknown): string {
  const key = String(v) as ObligationStatus;
  return dict.STATUS_LABELS[key] ?? String(v);
}

/**
 * Maps a backend error envelope to a friendly, localized message, interpolating
 * `params`. The backend sends no human text — only a machine `code` + structured
 * params.
 */
function messageForCode(
  code: string,
  params: Record<string, unknown>,
  dict: Dictionary,
): string {
  const { t } = dict;
  switch (code) {
    case 'VALIDATION_ERROR':
      return t.errValidation;
    case 'NOT_FOUND':
      return t.errNotFound;
    case 'INVALID_STATUS_TRANSITION':
      return interpolate(t.errInvalidTransition, {
        from: statusText(dict, params.current),
        to: statusText(dict, params.target),
      });
    case 'DOCUMENT_REQUIRED':
      return t.errDocumentRequired;
    case 'CONCURRENT_MODIFICATION':
      return t.toastConcurrentModification;
    case 'HTTP_ERROR':
      return interpolate(t.errHttp, { status: params.status ?? 'error' });
    case 'INTERNAL_ERROR':
      return t.errInternal;
    default:
      return t.errGeneric;
  }
}

function toMessage(err: unknown, dict: Dictionary): string {
  if (err instanceof ApiError) {
    const envelope = err.body as ErrorEnvelope;
    const code = envelope?.error?.code;
    if (code) return messageForCode(code, envelope.error?.params ?? {}, dict);
    return interpolate(dict.t.errBackend, { status: err.status });
  }
  return dict.t.errGeneric;
}
