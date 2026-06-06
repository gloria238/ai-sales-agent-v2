import { Skeleton } from "@/components/ui/skeleton";

export default function InboxDetailLoading() {
  return (
    <div className="h-full flex animate-in fade-in duration-300">
      <div className="hidden md:flex w-80 lg:w-96 flex-col border-r border-border p-4 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
            <Skeleton className="size-10 rounded-full shrink-0" />
            <div className="flex-1 min-w-0">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 flex flex-col p-6 gap-4">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <Skeleton className="size-10 rounded-full" />
          <div>
            <Skeleton className="h-5 w-36 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex-1 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className={`h-20 rounded-xl ${i % 2 === 0 ? "w-3/4 ml-auto" : "w-4/5"}`} />
          ))}
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}
