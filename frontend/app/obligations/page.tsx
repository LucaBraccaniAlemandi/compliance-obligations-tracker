import { Suspense } from 'react';
import Link from 'next/link';
import { t } from '@/app/lib/strings';
import {
  parseObligationSearchParams,
  type RawSearchParams,
} from '@/app/lib/obligation-search-params';
import { Button } from '@/components/ui/button';
import { DashboardContent } from './components/dashboard-content';
import { DashboardSkeleton } from './components/dashboard-skeleton';

export default async function ObligationsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = parseObligationSearchParams(await searchParams);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-9 pb-20">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h1 className="text-3xl font-light tracking-tight">{t.dashboardTitle}</h1>
        <Button asChild className="rounded-full">
          <Link href="/obligations/new">{t.create}</Link>
        </Button>
      </div>

      {/* No key: on filter/page navigation the content updates in place via a
          transition (stale-while-revalidate), preserving the search input's
          focus. The skeleton still shows on the initial load. */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent params={params} />
      </Suspense>
    </main>
  );
}
