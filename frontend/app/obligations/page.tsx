import { Suspense } from 'react';
import Link from 'next/link';
import { t } from '@/app/lib/strings';
import { Button } from '@/components/ui/button';
import { DashboardContent } from './components/dashboard-content';
import { DashboardSkeleton } from './components/dashboard-skeleton';

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
