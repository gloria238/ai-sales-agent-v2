import { Skeleton } from "@/components/ui/skeleton";

export default function InboxLoading() {
  return (
    <div className="h-full flex overflow-hidden">
      {/* Left panel skeleton */}
      <div className="w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-bg-card/50 shrink-0">
        <div className="p-4 border-b border-border space-y-3">
          <Skeleton className="h-6 w-16" />
          <div className="flex gap-1.5">
            <Skeleton className="h-7 w-12 rounded-lg" />
            <Skeleton className="h-7 w-16 rounded-lg" />
            <Skeleton className="h-7 w-24 rounded-lg" />
            <Skeleton className="h-7 w-14 rounded-lg" />
          </div>
        </div>
        <div className="flex-1 py-1">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="size-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Right placeholder */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-bg">
        <div className="text-center space-y-3">
          <Skeleton className="size-12 rounded-full mx-auto opacity-20" />
          <Skeleton className="h-4 w-40 mx-auto" />
          <Skeleton className="h-3 w-52 mx-auto" />
        </div>
      </div>
    </div>
  );
}
