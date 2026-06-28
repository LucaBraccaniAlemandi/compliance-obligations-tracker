/**
 * Zod schema for the obligation create/edit form.
 *
 * Shared between the client form (instant feedback) and the server action
 * (authoritative re-validation — server actions are a public surface).
 */

import { z } from 'zod';

const TAX_ID_RE = /^\d{2}-?\d{7}$/;

export const obligationFormSchema = z.object({
  type: z.enum([
    'annual_report',
    'franchise_tax',
    'boi_report',
    'registered_agent_renewal',
  ]),
  title: z.string().trim().min(1, 'Title is required.'),
  description: z.string().trim().default(''),
  dueDate: z
    .string()
    .min(1, 'Due date is required.')
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Enter a valid date.'),
  owner: z.string().trim().min(1, 'Owner is required.'),
  requiresDocument: z.boolean().default(false),
  companyTaxId: z
    .string()
    .trim()
    .refine((v) => v === '' || TAX_ID_RE.test(v), 'Use the format 12-3456789.')
    .default(''),
});

export type ObligationFormValues = z.infer<typeof obligationFormSchema>;

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
