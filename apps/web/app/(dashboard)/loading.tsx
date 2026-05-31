import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 py-5 lg:px-8 lg:py-6 space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-6 w-64" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-bg-card px-5 py-4">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-3 w-20 mt-3 mb-1" />
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-3 w-28 mt-1" />
            </div>
          ))}
        </div>

        {/* Activity + Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="rounded-xl border border-border bg-bg-card p-5">
            <Skeleton className="h-5 w-20 mb-4" />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 rounded-lg mb-2" />
            ))}
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-bg-card p-5">
                <Skeleton className="h-5 w-24 mb-1" />
                <Skeleton className="h-3 w-32 mb-4" />
                <Skeleton className="size-[120px] rounded-full mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
