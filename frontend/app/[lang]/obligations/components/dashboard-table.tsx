'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  ObligationKpis,
  ObligationListParams,
  ObligationPage,
  ObligationStatus,
} from '@/app/lib/types';
import { encodeObligationParams } from '@/app/lib/obligation-search-params';
import { statusBadgeVariant } from '@/app/lib/obligations-domain';
import { useDictionary, useLang } from '@/app/lib/dictionaries/provider';
import { intlLocale } from '@/app/lib/dictionaries/config';

const STATUSES: ObligationStatus[] = ['pending', 'in_progress', 'submitted', 'done'];

/** Tri-state overdue filter encoded as a Select value. */
type OverdueValue = 'all' | 'true' | 'false';

function overdueToValue(overdue: boolean | undefined): OverdueValue {
  return overdue === undefined ? 'all' : overdue ? 'true' : 'false';
}

export function DashboardTable({
  page,
  params,
  kpis,
}: {
  page: ObligationPage;
  params: ObligationListParams;
  kpis: ObligationKpis;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const lang = useLang();
  const { t, STATUS_LABELS, TYPE_LABELS } = useDictionary();
  const [isPending, startTransition] = useTransition();

  const formatDate = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(intlLocale[lang], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    return (iso: string) => {
      const d = new Date(`${iso}T00:00:00`);
      return Number.isNaN(d.getTime()) ? iso : fmt.format(d);
    };
  }, [lang]);

  const STATUS_KPI_LABELS: Record<ObligationStatus, string> = {
    pending: t.kpiPending,
    in_progress: t.kpiInProgress,
    submitted: t.kpiSubmitted,
    done: t.kpiDone,
  };

  const { items, total, limit, offset } = page;
  const activeStatuses = params.status ?? [];

  /**
   * Navigate to a new param set. Filter changes pass `resetOffset` so the user
   * lands back on the first page; pagination keeps the current filters.
   */
  function navigate(next: ObligationListParams) {
    const qs = encodeObligationParams(next).toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function toggleStatus(status: ObligationStatus, checked: boolean) {
    const nextStatus = checked
      ? [...activeStatuses, status]
      : activeStatuses.filter((s) => s !== status);
    navigate({
      ...params,
      status: nextStatus.length > 0 ? nextStatus : undefined,
      offset: 0,
    });
  }

  function setOverdue(value: OverdueValue) {
    navigate({
      ...params,
      overdue: value === 'all' ? undefined : value === 'true',
      offset: 0,
    });
  }

  function clearFilters() {
    navigate({ limit, offset: 0 });
  }

  // Title search: local state for responsive typing, debounced into the URL.
  const [titleInput, setTitleInput] = useState(params.title ?? '');

  // When the URL title changes from outside (Clear filters, browser
  // back/forward), reset the input to match — using React's adjust-state-during-
  // render pattern so the debounce effect below never re-pushes a stale value.
  const urlTitle = params.title ?? '';
  const [lastUrlTitle, setLastUrlTitle] = useState(urlTitle);
  if (urlTitle !== lastUrlTitle) {
    setLastUrlTitle(urlTitle);
    setTitleInput(urlTitle);
  }

  useEffect(() => {
    const current = params.title ?? '';
    if (titleInput === current) return; // already in sync — nothing to push
    const id = setTimeout(() => {
      navigate({ ...params, title: titleInput || undefined, offset: 0 });
    }, 300);
    return () => clearTimeout(id);
    // `navigate` is stable enough for this purpose; re-running on param change
    // is intentional so a server-applied title resets the early-return guard.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleInput, params]);

  // Backend-derived metrics. `overdue` overlaps the status buckets — render it
  // as its own card; it is never summed into the totals.
  const kpiCards = useMemo<{ label: string; value: number; attn?: boolean }[]>(
    () => [
      { label: t.kpiTotal, value: kpis.total },
      ...STATUSES.map((s) => ({
        label: STATUS_KPI_LABELS[s],
        value: kpis.byStatus[s] ?? 0,
      })),
      { label: t.kpiOverdue, value: kpis.overdue, attn: true },
    ],
    // Recompute when the locale (and thus `t`) changes so labels re-translate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kpis, t],
  );

  const hasFilters =
    activeStatuses.length > 0 || params.overdue !== undefined || Boolean(params.title);

  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = Math.min(offset + limit, total);
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  function goPrev() {
    navigate({ ...params, offset: Math.max(offset - limit, 0) });
  }
  function goNext() {
    navigate({ ...params, offset: offset + limit });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpiCards.map((k) => (
          <Card key={k.label} className="gap-0 p-4">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {k.label}
            </div>
            <div className="mt-1.5 text-3xl font-light tabular-nums">{k.value}</div>
            {k.attn && k.value > 0 ? (
              <div className="mt-2.5 border-t pt-1.5 text-[10px] font-medium uppercase tracking-wide text-destructive">
                {t.kpiAttn}
              </div>
            ) : null}
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t.filterStatus}
          </Label>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {STATUSES.map((s) => (
              <Label
                key={s}
                className="flex cursor-pointer items-center gap-2 text-sm font-normal"
              >
                <Checkbox
                  checked={activeStatuses.includes(s)}
                  onCheckedChange={(c) => toggleStatus(s, c === true)}
                />
                {STATUS_LABELS[s]}
              </Label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t.filterOverdue}
          </Label>
          <Select value={overdueToValue(params.overdue)} onValueChange={setOverdue}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.overdueAll}</SelectItem>
              <SelectItem value="true">{t.overdueOnly}</SelectItem>
              <SelectItem value="false">{t.overdueNot}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t.filterTitle}
          </Label>
          <Input
            type="search"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder={t.filterTitlePlaceholder}
            className="w-56"
          />
        </div>

        {hasFilters ? (
          <Button variant="ghost" size="sm" className="pb-2" onClick={clearFilters}>
            {t.filterClear}
          </Button>
        ) : null}

        <span className="ml-auto pb-2 text-sm tabular-nums text-muted-foreground">
          {total === 0
            ? `0 ${t.dashboardTitle.toLowerCase()}`
            : `${rangeStart}–${rangeEnd} ${t.rangeOf} ${total}`}
        </span>
      </div>

      {total === 0 ? (
        <Card className="flex flex-col items-center gap-2 border-dashed p-14 text-center">
          <p className="text-lg font-medium">{t.noMatchTitle}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{t.noMatchBody}</p>
          <Button variant="outline" className="mt-4 rounded-full" onClick={clearFilters}>
            {t.filterClear}
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table className={`transition-opacity ${isPending ? 'opacity-60' : ''}`}>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>{t.colTitle}</TableHead>
                <TableHead>{t.colType}</TableHead>
                <TableHead>{t.colStatus}</TableHead>
                <TableHead>{t.colOwner}</TableHead>
                <TableHead>{t.colDue}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((o) => {
                const overdue = o.overdue;
                return (
                  <TableRow
                    key={o.id}
                    onClick={() => router.push(`/${lang}/obligations/${o.id}`)}
                    className="cursor-pointer border-l-[3px]"
                    style={{ borderLeftColor: overdue ? 'var(--destructive)' : 'transparent' }}
                  >
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/${lang}/obligations/${o.id}`}
                            className="font-medium hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {o.title}
                          </Link>
                          {overdue ? (
                            <Badge
                              variant="outline"
                              className="border-destructive text-[9px] uppercase tracking-wide text-destructive"
                            >
                              {t.overdueTag}
                            </Badge>
                          ) : null}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground/80">
                      {TYPE_LABELS[o.type]}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(o.status)}>
                        {STATUS_LABELS[o.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground/80">{o.owner}</TableCell>
                    <TableCell className="tabular-nums text-foreground/80">
                      {formatDate(o.dueDate)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {total > limit ? (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={goPrev} disabled={!canPrev || isPending}>
            {t.paginationPrev}
          </Button>
          <Button variant="outline" size="sm" onClick={goNext} disabled={!canNext || isPending}>
            {t.paginationNext}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
