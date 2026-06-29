import Link from 'next/link';
import { getObligations } from '@/app/lib/obligations';
import { ApiError } from '@/app/lib/api';
import { t } from '@/app/lib/strings';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DashboardTable } from './dashboard-table';

export async function DashboardContent() {
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
