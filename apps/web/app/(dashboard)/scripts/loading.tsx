import { Skeleton } from "@/components/ui/skeleton";

export default function ScriptsLoading() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 py-5 lg:px-8 lg:py-6 space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-4 w-56 mt-1" />
          </div>
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-bg-card p-5">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-2/3 mb-3" />
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
