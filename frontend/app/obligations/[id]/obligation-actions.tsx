'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { transitionObligation, attachDocument } from '@/app/lib/actions';
import {
  allowedTransitions,
  transitionBlockedReason,
} from '@/app/lib/obligations-domain';
import { TRANSITION_LABELS, t } from '@/app/lib/strings';
import type { Obligation, ObligationStatus } from '@/app/lib/types';

export function ObligationActions({ obligation }: { obligation: Obligation }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const transitions = allowedTransitions(obligation.status);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? 'Action failed.');
      else router.refresh();
    });
  }

  if (transitions.length === 0) {
    return <p className="text-sm text-muted-foreground">{t.noActions}</p>;
  }

  return (
    <div className="flex flex-col gap-3.5">
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
      {transitions.map((to: ObligationStatus) => {
        const reason = transitionBlockedReason(obligation, to);
        const disabled = reason !== null || pending;
        const primary = to === 'submitted' || to === 'done';
        return (
          <div key={to} className="flex flex-col gap-1.5">
            <Button
              type="button"
              variant={primary ? 'default' : 'outline'}
              className="w-full rounded-full"
              disabled={disabled}
              aria-disabled={disabled}
              onClick={() => run(() => transitionObligation(obligation.id, to))}
            >
              {TRANSITION_LABELS[to]}
            </Button>
            {reason ? (
              <p className="flex gap-1.5 text-[11px] leading-snug text-muted-foreground">
                <span aria-hidden="true" className="font-medium text-destructive">
                  !
                </span>
                <span>{reason}</span>
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function AttachDocumentButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="rounded-full"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await attachDocument(id);
          if (res.ok) router.refresh();
        })
      }
    >
      {t.attach}
    </Button>
  );
}
