import Link from 'next/link';
import { getObligationOrNotFound } from '@/app/lib/obligations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { statusBadgeVariant } from '@/app/lib/obligations-domain';
import { STATUS_LABELS, TYPE_LABELS, t } from '@/app/lib/strings';
import { ObligationActions, AttachDocumentButton } from './obligation-actions';
import type { ObligationStatus } from '@/app/lib/types';

const dateFmt = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});
const dateTimeFmt = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const fmtDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : dateFmt.format(d);
};
const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : dateTimeFmt.format(d);
};

export default async function ObligationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const o = await getObligationOrNotFound(id);

  const overdue = o.overdue;
  const history = [...o.history].reverse();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-9 pb-20">
      <Link
        href="/obligations"
        className="mb-4 inline-block text-sm text-primary hover:underline"
      >
        ← {t.back}
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-light tracking-tight">{o.title}</h1>
            <Badge variant={statusBadgeVariant(o.status)}>
              {STATUS_LABELS[o.status]}
            </Badge>
            {overdue ? (
              <Badge
                variant="outline"
                className="border-destructive text-[9px] uppercase tracking-wide text-destructive"
              >
                {t.overdueTag}
              </Badge>
            ) : null}
          </div>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {o.id}
          </span>
        </div>
        <Button asChild variant="outline" className="rounded-full">
          <Link href={`/obligations/${o.id}/edit`}>{t.edit}</Link>
        </Button>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* LEFT */}
        <div className="flex flex-col gap-4">
          <Card className="gap-2 p-6">
            <SectionLabel>{t.detailDescription}</SectionLabel>
            <p className="text-base leading-relaxed text-foreground/85">
              {o.description}
            </p>
          </Card>

          <Card className="gap-3 p-6">
            <SectionLabel>{t.detailDocument}</SectionLabel>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-9 items-center justify-center rounded border bg-muted font-mono text-[9px] text-muted-foreground">
                  {o.hasDocument ? 'PDF' : '—'}
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">
                    {o.hasDocument ? t.docAttached : t.docMissing}
                  </span>
                  {o.hasDocument ? (
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {o.type}.pdf
                    </span>
                  ) : null}
                  {o.requiresDocument && !o.hasDocument ? (
                    <Badge
                      variant="secondary"
                      className="w-fit text-[9px] uppercase tracking-wide"
                    >
                      {t.docRequired}
                    </Badge>
                  ) : null}
                </div>
              </div>
              {o.requiresDocument && !o.hasDocument ? (
                <AttachDocumentButton id={o.id} />
              ) : null}
            </div>
          </Card>

          <Card className="gap-3 p-6">
            <SectionLabel>{t.historyTitle}</SectionLabel>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.historyEmpty}</p>
            ) : (
              <ol className="flex flex-col">
                {history.map((h, i) => (
                  <li
                    key={i}
                    className="flex gap-3 border-b py-2.5 last:border-0"
                  >
                    <span aria-hidden="true" className="text-[10px] leading-6 text-primary">
                      ●
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm">
                        <span className="text-muted-foreground">
                          {STATUS_LABELS[h.from as ObligationStatus]}
                        </span>{' '}
                        → <span className="font-medium">{STATUS_LABELS[h.to]}</span>
                      </span>
                      <span className="text-[11px] tabular-nums text-muted-foreground">
                        {fmtDateTime(h.at)}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-4">
          <Card className="p-6">
            <dl className="flex flex-col gap-3.5">
              <Meta label={t.detailType} value={TYPE_LABELS[o.type]} />
              <Meta label={t.detailOwner} value={o.owner} />
              <Meta
                label={t.detailDue}
                value={fmtDate(o.dueDate)}
                mono
              />
              <Meta label={t.requiresDoc} value={o.requiresDocument ? t.yes : t.no} />
              <div className="flex flex-col gap-1">
                <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t.detailTaxId}
                </dt>
                <dd className="m-0 flex items-center gap-2">
                  <span className="font-mono text-sm tabular-nums">
                    {o.companyTaxId}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    ({t.taxidNote})
                  </span>
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="gap-1.5 p-6">
            <SectionLabel>{t.actionsTitle}</SectionLabel>
            <p className="mb-3.5 text-[11px] leading-snug text-muted-foreground">
              {t.actionsNote}
            </p>
            <ObligationActions obligation={o} />
          </Card>
        </div>
      </div>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] uppercase tracking-wider text-muted-foreground">
      {children}
    </h2>
  );
}

function Meta({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className={`m-0 text-sm ${mono ? 'tabular-nums' : ''}`}>{value}</dd>
    </div>
  );
}
