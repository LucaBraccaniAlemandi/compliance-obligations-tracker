'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { Obligation, ObligationStatus, ObligationType } from '@/app/lib/types';
import {
  isOverdue,
  isDueSoon,
  statusBadgeVariant,
} from '@/app/lib/obligations-domain';
import { STATUS_LABELS, TYPE_LABELS, t } from '@/app/lib/strings';

const STATUSES: ObligationStatus[] = ['pending', 'in_progress', 'submitted', 'done'];
const TYPES: ObligationType[] = [
  'annual_report',
  'franchise_tax',
  'boi_report',
  'registered_agent_renewal',
];

const dateFmt = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : dateFmt.format(d);
}

export function DashboardTable({ obligations }: { obligations: Obligation[] }) {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<'all' | ObligationStatus>('all');
  const [filterType, setFilterType] = useState<'all' | ObligationType>('all');
  const [overdueOnly, setOverdueOnly] = useState(false);

  const kpis = useMemo(() => {
    const count = (s: ObligationStatus) =>
      obligations.filter((o) => o.status === s).length;
    return [
      { label: t.kpiTotal, value: obligations.length },
      { label: t.kpiPending, value: count('pending') },
      { label: t.kpiInProgress, value: count('in_progress') },
      { label: t.kpiSubmitted, value: count('submitted') },
      { label: t.kpiDone, value: count('done') },
      {
        label: t.kpiOverdue,
        value: obligations.filter((o) => isOverdue(o)).length,
        attn: true,
      },
      {
        label: t.kpiDueSoon,
        value: obligations.filter((o) => isDueSoon(o)).length,
        attn: true,
      },
    ];
  }, [obligations]);

  const rows = useMemo(() => {
    return obligations
      .filter(
        (o) =>
          (filterStatus === 'all' || o.status === filterStatus) &&
          (filterType === 'all' || o.type === filterType) &&
          (!overdueOnly || isOverdue(o)),
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [obligations, filterStatus, filterType, overdueOnly]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {kpis.map((k) => (
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
          <Select
            value={filterStatus}
            onValueChange={(v) => setFilterStatus(v as 'all' | ObligationStatus)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.filterAll}</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t.filterType}
          </Label>
          <Select
            value={filterType}
            onValueChange={(v) => setFilterType(v as 'all' | ObligationType)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.filterAll}</SelectItem>
              {TYPES.map((ty) => (
                <SelectItem key={ty} value={ty}>
                  {TYPE_LABELS[ty]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Label className="flex cursor-pointer items-center gap-2 pb-2 text-sm font-normal">
          <Checkbox
            checked={overdueOnly}
            onCheckedChange={(c) => setOverdueOnly(c === true)}
          />
          {t.filterOverdueOnly}
        </Label>

        <span className="ml-auto pb-2 text-sm tabular-nums text-muted-foreground">
          {rows.length} of {obligations.length} {t.resultsShown}
        </span>
      </div>

      <Card className="overflow-hidden p-0">
        <Table>
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
            {rows.map((o) => {
              const overdue = isOverdue(o);
              return (
                <TableRow
                  key={o.id}
                  onClick={() => router.push(`/obligations/${o.id}`)}
                  className="cursor-pointer border-l-[3px]"
                  style={{ borderLeftColor: overdue ? 'var(--destructive)' : 'transparent' }}
                >
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/obligations/${o.id}`}
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
                      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                        {o.id}
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
    </div>
  );
}
