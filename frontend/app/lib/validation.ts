/**
 * Zod schema for the obligation create/edit form.
 *
 * Shared between the client form (instant feedback) and the server action
 * (authoritative re-validation — server actions are a public surface). Messages
 * are injected so both sides render them in the active locale.
 */

import { z } from 'zod';
import { en, type Dictionary } from './dictionaries/en';

const TAX_ID_RE = /^\d{2}-?\d{7}$/;

export interface ValidationMessages {
  titleRequired: string;
  dueRequired: string;
  dueInvalid: string;
  ownerRequired: string;
  taxIdFormat: string;
}

/** Pulls the localized validation messages out of a dictionary's `t`. */
export function validationMessages(t: Dictionary['t']): ValidationMessages {
  return {
    titleRequired: t.vTitleRequired,
    dueRequired: t.vDueRequired,
    dueInvalid: t.vDueInvalid,
    ownerRequired: t.vOwnerRequired,
    taxIdFormat: t.vTaxIdFormat,
  };
}

export function buildObligationFormSchema(m: ValidationMessages) {
  return z.object({
    type: z.enum([
      'annual_report',
      'franchise_tax',
      'boi_report',
      'registered_agent_renewal',
    ]),
    title: z.string().trim().min(1, m.titleRequired),
    description: z.string().trim().default(''),
    dueDate: z
      .string()
      .min(1, m.dueRequired)
      .refine((v) => !Number.isNaN(Date.parse(v)), m.dueInvalid),
    owner: z.string().trim().min(1, m.ownerRequired),
    requiresDocument: z.boolean().default(false),
    companyTaxId: z
      .string()
      .trim()
      .refine((v) => v === '' || TAX_ID_RE.test(v), m.taxIdFormat)
      .default(''),
  });
}

export type ObligationFormValues = z.infer<
  ReturnType<typeof buildObligationFormSchema>
>;

/**
 * Default English schema for locale-agnostic callers (e.g. unit tests). UI code
 * should build a localized schema with `buildObligationFormSchema` instead.
 */
export const obligationFormSchema = buildObligationFormSchema(validationMessages(en.t));

/** Reads obligation fields out of submitted FormData (pre-validation). */
export function readObligationForm(formData: FormData) {
  return {
    type: String(formData.get('type') ?? 'annual_report'),
    title: String(formData.get('title') ?? ''),
    description: String(formData.get('description') ?? ''),
    dueDate: String(formData.get('dueDate') ?? ''),
    owner: String(formData.get('owner') ?? ''),
    requiresDocument: formData.get('requiresDocument') === 'on',
    companyTaxId: String(formData.get('companyTaxId') ?? ''),
  };
}
