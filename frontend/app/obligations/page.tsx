import { Suspense } from 'react';
import Link from 'next/link';
import { getObligations } from '@/app/lib/obligations';
import { ApiError } from '@/app/lib/api';
import { t } from '@/app/lib/strings';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardTable } from './dashboard-table';

export default function ObligationsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-9 pb-20">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h1 className="text-3xl font-light tracking-tight">{t.dashboardTitle}</h1>
        <Button asChild className="rounded-full">
          <Link href="/obligations/new">{t.create}</Link>
        </Button>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}

async function DashboardContent() {
  let obligations;
  try {
    obligations = await getObligations();
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

  if (obligations.length === 0) {
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

  return <DashboardTable obligations={obligations} />;
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i} className="gap-3 p-4">
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-6 w-2/5" />
          </Card>
        ))}
      </div>
      <Card className="p-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b p-4 last:border-0">
            <Skeleton className="h-4 flex-[2]" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </Card>
      <p className="text-sm text-muted-foreground">{t.loading}</p>
    </div>
  );
}
