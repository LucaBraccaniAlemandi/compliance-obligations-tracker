import Link from 'next/link';
import { getObligations, getObligationKpis } from '@/app/lib/obligations';
import type {
  ObligationKpis,
  ObligationListParams,
  ObligationPage,
} from '@/app/lib/types';
import { hasActiveFilters } from '@/app/lib/obligation-search-params';
import { ApiError } from '@/app/lib/api';
import { t } from '@/app/lib/strings';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DashboardTable } from './dashboard-table';

export async function DashboardContent({
  params,
}: {
  params: ObligationListParams;
}) {
  let page: ObligationPage;
  let kpis: ObligationKpis;
  try {
    // Independent reads — fetch in parallel to avoid a request waterfall.
    [page, kpis] = await Promise.all([
      getObligations(params),
      getObligationKpis(),
    ]);
  } catch (err) {
    const detail = err instanceof ApiError ? ` (status ${err.status})` : '';
    return (
      <Card
        role="alert"
        className="flex flex-col items-center gap-2 p-8 text-center"
      >
        <p className="text-lg font-medium">{t.errorTitle}</p>
        <p className="text-sm text-muted-foreground">
          {t.errorBody}
          {detail}
        </p>
      </Card>
    );
  }

  // No obligations at all (and no filters applied) — first-run empty state.
  if (page.total === 0 && !hasActiveFilters(params)) {
    return (
      <Card className="flex flex-col items-center gap-2 border-dashed p-14 text-center">
        <p className="text-lg font-medium">{t.emptyTitle}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{t.emptyBody}</p>
        <Button asChild className="mt-4 rounded-full">
          <Link href="/obligations/new">{t.create}</Link>
        </Button>
      </Card>
    );
  }

  // Filtered down to zero is handled inside DashboardTable so the filter
  // controls stay visible and the user can clear them.
  return <DashboardTable page={page} params={params} kpis={kpis} />;
}
