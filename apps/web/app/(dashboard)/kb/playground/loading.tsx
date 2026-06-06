import { Skeleton } from "@/components/ui/skeleton";

export default function KbPlaygroundLoading() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-5 lg:px-8 lg:py-6 space-y-6 animate-in fade-in duration-300">
        <Skeleton className="h-7 w-44" />
        <div className="rounded-xl border border-border bg-bg-card p-6 space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        <div className="rounded-xl border border-border bg-bg-card p-6 space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}
