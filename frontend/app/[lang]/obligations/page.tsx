import { Suspense } from 'react';
import Link from 'next/link';
import { getDictionary } from '@/app/lib/dictionaries/get';
import type { Locale } from '@/app/lib/dictionaries/config';
import {
  parseObligationSearchParams,
  type RawSearchParams,
} from '@/app/lib/obligation-search-params';
import { Button } from '@/components/ui/button';
import { DashboardContent } from './components/dashboard-content';
import { DashboardSkeleton } from './components/dashboard-skeleton';

export default async function ObligationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: Locale }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { lang } = await params;
  const parsed = parseObligationSearchParams(await searchParams);
  const { t } = await getDictionary(lang);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-9 pb-20">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h1 className="text-3xl font-light tracking-tight">{t.dashboardTitle}</h1>
        <Button asChild className="rounded-full">
          <Link href={`/${lang}/obligations/new`}>{t.create}</Link>
        </Button>
      </div>

      {/* No key: on filter/page navigation the content updates in place via a
          transition (stale-while-revalidate), preserving the search input's
          focus. The skeleton still shows on the initial load. */}
      <Suspense fallback={<DashboardSkeleton label={t.loading} />}>
        <DashboardContent params={parsed} lang={lang} />
      </Suspense>
    </main>
  );
}
