import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton({ label }: { label: string }) {
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
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
