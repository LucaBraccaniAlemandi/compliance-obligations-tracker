'use client';

import { useActionState, useEffect, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ActionResult, FieldErrors, ObligationType } from '@/app/lib/types';
import { obligationFormSchema } from '@/app/lib/validation';
import { TYPE_LABELS, t } from '@/app/lib/strings';

const TYPES: ObligationType[] = [
  'annual_report',
  'franchise_tax',
  'boi_report',
  'registered_agent_renewal',
];

export interface ObligationFormDefaults {
  type: ObligationType;
  title: string;
  description: string;
  dueDate: string;
  owner: string;
  requiresDocument: boolean;
  companyTaxId: string;
}

const BLANK: ObligationFormDefaults = {
  type: 'annual_report',
  title: '',
  description: '',
  dueDate: '',
  owner: '',
  requiresDocument: false,
  companyTaxId: '',
};

interface Props {
  action: (
    prev: ActionResult | undefined,
    formData: FormData,
  ) => Promise<ActionResult>;
  defaults?: ObligationFormDefaults;
  /** Where to navigate after a successful save. */
  redirectTo: string;
}

export function ObligationForm({ action, defaults = BLANK, redirectTo }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    ActionResult | undefined,
    FormData
  >(action, undefined);

  // Client-side validation errors (instant feedback before the round-trip).
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  // Controlled `type` so the native <select> value reaches the server action.
  const [type, setType] = useState<ObligationType>(defaults.type);

  useEffect(() => {
    if (state?.ok) router.push(redirectTo);
  }, [state, redirectTo, router]);

  const serverErrors = state && !state.ok ? state.fieldErrors ?? {} : {};
  const errors: FieldErrors = { ...serverErrors, ...clientErrors };
  const hasServerBanner = Boolean(state && !state.ok && state.fieldErrors);

  function handleSubmit(formData: FormData) {
    const parsed = obligationFormSchema.safeParse({
      type: String(formData.get('type') ?? ''),
      title: String(formData.get('title') ?? ''),
      description: String(formData.get('description') ?? ''),
      dueDate: String(formData.get('dueDate') ?? ''),
      owner: String(formData.get('owner') ?? ''),
      requiresDocument: formData.get('requiresDocument') === 'on',
      companyTaxId: String(formData.get('companyTaxId') ?? ''),
    });

    if (!parsed.success) {
      const fe: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '');
        if (key && !fe[key]) fe[key] = issue.message;
      }
      setClientErrors(fe);
      return; // Block the server action until the form is valid.
    }
    setClientErrors({});
    formAction(formData);
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4" noValidate>
      {hasServerBanner ? (
        <Alert variant="destructive">
          <AlertDescription>{t.serverErrorBanner}</AlertDescription>
        </Alert>
      ) : null}

      <Field label={t.fType} htmlFor="fld-type">
        <input type="hidden" name="type" value={type} />
        <Select value={type} onValueChange={(v) => setType(v as ObligationType)}>
          <SelectTrigger id="fld-type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((ty) => (
              <SelectItem key={ty} value={ty}>
                {TYPE_LABELS[ty]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label={t.fTitle} htmlFor="fld-title" required error={errors.title}>
        <Input
          id="fld-title"
          name="title"
          defaultValue={defaults.title}
          aria-invalid={Boolean(errors.title)}
        />
      </Field>

      <Field label={t.fDescription} htmlFor="fld-desc">
        <Textarea
          id="fld-desc"
          name="description"
          rows={3}
          defaultValue={defaults.description}
        />
      </Field>

      <div className="flex flex-wrap gap-4">
        <Field
          label={t.fDue}
          htmlFor="fld-due"
          required
          error={errors.dueDate}
          className="min-w-44 flex-1"
        >
          <Input
            id="fld-due"
            name="dueDate"
            type="date"
            defaultValue={defaults.dueDate}
            aria-invalid={Boolean(errors.dueDate)}
          />
        </Field>
        <Field
          label={t.fOwner}
          htmlFor="fld-owner"
          required
          error={errors.owner}
          className="min-w-44 flex-1"
        >
          <Input
            id="fld-owner"
            name="owner"
            defaultValue={defaults.owner}
            aria-invalid={Boolean(errors.owner)}
          />
        </Field>
      </div>

      <Field
        label={t.fTaxId}
        htmlFor="fld-tax"
        error={errors.companyTaxId}
        help={t.taxidHelp}
      >
        <Input
          id="fld-tax"
          name="companyTaxId"
          placeholder="12-3456789"
          defaultValue={defaults.companyTaxId}
          aria-invalid={Boolean(errors.companyTaxId)}
          className="font-mono tabular-nums"
        />
      </Field>

      <Label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm font-normal">
        <Checkbox name="requiresDocument" defaultChecked={defaults.requiresDocument} />
        {t.fRequiresDoc}
      </Label>

      <div className="mt-1.5 flex gap-2.5 border-t pt-5">
        <Button type="submit" disabled={pending} className="rounded-full">
          {pending ? t.saving : t.save}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={() => router.back()}
        >
          {t.cancel}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  required,
  error,
  help,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  help?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const helpId = useId();
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <Label htmlFor={htmlFor} className="text-sm font-normal">
        {label}
        {required ? (
          <span className="font-light text-muted-foreground"> ({t.requiredMark})</span>
        ) : null}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="flex gap-1.5 text-xs text-destructive">
          <span aria-hidden="true" className="font-medium">
            !
          </span>
          {error}
        </p>
      ) : null}
      {help ? (
        <p id={helpId} className="text-[11px] text-muted-foreground">
          {help}
        </p>
      ) : null}
    </div>
  );
}
