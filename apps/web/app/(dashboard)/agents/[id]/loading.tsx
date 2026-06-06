import { Skeleton } from "@/components/ui/skeleton";

export default function AgentDetailLoading() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-5 lg:px-8 lg:py-6 space-y-6 animate-in fade-in duration-300">
        <Skeleton className="h-7 w-44" />
        <div className="rounded-xl border border-border bg-bg-card p-6 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
