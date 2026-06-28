'use server';

import { revalidatePath } from 'next/cache';
import { apiPost, apiPut, apiPatch, apiDelete, ApiError } from './api';
import { obligationFormSchema, readObligationForm } from './validation';
import type { ActionResult, FieldErrors, Obligation, ObligationStatus } from './types';

/**
 * Server Actions for mutating obligations on the separate backend.
 *
 * Reachable via direct POST, not only through the UI, so every action
 * re-validates its input here. When auth lands, validate the session at the top
 * of every action before touching the backend.
 */

function validateForm(
  formData: FormData,
): { ok: true; data: Obligation } | { ok: false; fieldErrors: FieldErrors } {
  const parsed = obligationFormSchema.safeParse(readObligationForm(formData));
  if (parsed.success) {
    return { ok: true, data: parsed.data as unknown as Obligation };
  }
  const fieldErrors: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { ok: false, fieldErrors };
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
    await apiPost<Obligation>('/api/obligations', result.data);
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
    await apiPut<Obligation>(`/api/obligations/${id}`, result.data);
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
    await apiPatch<Obligation>(`/api/obligations/${id}`, { status: to });
    revalidatePath('/obligations');
    revalidatePath(`/obligations/${id}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toMessage(err) };
  }
}

export async function attachDocument(id: string): Promise<ActionResult> {
  try {
    await apiPatch<Obligation>(`/api/obligations/${id}`, { hasDocument: true });
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

function toMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return `Backend error (${err.status})`;
  }
  return 'Something went wrong. Please try again.';
}
