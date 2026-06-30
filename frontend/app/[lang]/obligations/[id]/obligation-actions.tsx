'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { transitionObligation, attachDocument, deleteObligation } from '@/app/lib/actions';
import { allowedTransitions } from '@/app/lib/obligations-domain';
import { useDictionary } from '@/app/lib/dictionaries/provider';
import type { Locale } from '@/app/lib/dictionaries/config';
import type { Obligation, ObligationStatus } from '@/app/lib/types';

export function ObligationActions({ obligation }: { obligation: Obligation }) {
  const { t, TRANSITION_LABELS } = useDictionary();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // status + version are owned locally so a retry after a conflict uses the
  // freshest version immediately. router.refresh() keeps the server-rendered
  // header badge and history list in sync; this state drives the buttons.
  const [status, setStatus] = useState<ObligationStatus>(obligation.status);
  const [version, setVersion] = useState<number>(obligation.version);

  const transitions = allowedTransitions(status);

  function run(to: ObligationStatus) {
    startTransition(async () => {
      const res = await transitionObligation(obligation.id, to, version);
      if (res.ok) {
        setStatus(res.status);
        setVersion(res.version);
        toast.success(t.toastStatusUpdated);
        router.refresh();
        return;
      }
      if ('code' in res && res.code === 'CONCURRENT_MODIFICATION') {
        // re-apply their change automatically.
        setStatus(res.status);
        setVersion(res.version);
        toast.warning(res.error);
        router.refresh();
        return;
      }
      toast.error(res.error ?? t.toastActionFailed);
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
            onClick={() => run(to)}
          >
            {TRANSITION_LABELS[status][to]}
          </Button>
        );
      })}
    </div>
  );
}

export function AttachDocumentButton({ id }: { id: string }) {
  const { t } = useDictionary();
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

export function DeleteObligationButton({ id, lang }: { id: string; lang: Locale }) {
  const { t } = useDictionary();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full rounded-full border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
      disabled={pending}
      onClick={() => {
        // Hard delete; no undo. Confirm before hitting the backend.
        if (!window.confirm(t.deleteConfirm)) return;
        startTransition(async () => {
          const fd = new FormData();
          fd.set('id', id);
          const res = await deleteObligation(fd);
          if (res.ok) {
            toast.success(t.toastDeleted);
            // The detail page is gone now; return to the list.
            router.push(`/${lang}/obligations`);
            router.refresh();
          } else {
            toast.error(res.error ?? t.toastActionFailed);
          }
        });
      }}
    >
      {pending ? t.deleting : t.delete}
    </Button>
  );
}
