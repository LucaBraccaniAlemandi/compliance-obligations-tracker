'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { transitionObligation, attachDocument } from '@/app/lib/actions';
import { allowedTransitions } from '@/app/lib/obligations-domain';
import { TRANSITION_LABELS, t } from '@/app/lib/strings';
import type { Obligation, ObligationStatus } from '@/app/lib/types';

export function ObligationActions({ obligation }: { obligation: Obligation }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const transitions = allowedTransitions(obligation.status);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        toast.error(res.error ?? t.toastActionFailed);
      } else {
        toast.success(t.toastStatusUpdated);
        router.refresh();
      }
    });
  }

  if (transitions.length === 0) {
    return <p className="text-sm text-muted-foreground">{t.noActions}</p>;
  }

  return (
    <div className="flex flex-col gap-3.5">
      {/*
        Transition rules (e.g. a required document before submit) are enforced
        by the backend. We attempt the transition and surface any error it
        returns, rather than disabling buttons from client-side guesses.
      */}
      {transitions.map((to: ObligationStatus) => {
        const primary = to === 'submitted' || to === 'done';
        return (
          <Button
            key={to}
            type="button"
            variant={primary ? 'default' : 'outline'}
            className="w-full rounded-full"
            disabled={pending}
            onClick={() => run(() => transitionObligation(obligation.id, to))}
          >
            {TRANSITION_LABELS[to]}
          </Button>
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
          if (res.ok) {
            toast.success(t.toastDocAttached);
            router.refresh();
          } else {
            toast.error(res.error ?? t.toastActionFailed);
          }
        })
      }
    >
      {t.attach}
    </Button>
  );
}
