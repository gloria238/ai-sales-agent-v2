import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 py-5 lg:px-8 lg:py-6 space-y-6 animate-in fade-in duration-300">
        <div>
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-64 mt-1" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-bg-card p-5">
              <Skeleton className="size-10 rounded-xl mb-3" />
              <Skeleton className="h-3 w-20 mb-1" />
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-3 w-28 mt-1" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-bg-card p-6">
            <Skeleton className="h-5 w-32 mb-4" />
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-7 rounded-full mb-3" />
            ))}
          </div>
          <div className="rounded-xl border border-border bg-bg-card p-6">
            <Skeleton className="h-5 w-36 mb-4" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-lg mb-3" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
