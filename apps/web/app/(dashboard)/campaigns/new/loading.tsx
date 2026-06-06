import { Skeleton } from "@/components/ui/skeleton";

export default function NewCampaignLoading() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-5 lg:px-8 lg:py-6 space-y-6 animate-in fade-in duration-300">
        <Skeleton className="h-7 w-36" />
        <div className="rounded-xl border border-border bg-bg-card p-6 space-y-5">
          <Skeleton className="h-5 w-28 mb-1" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-5 w-24 mb-1" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <div className="flex items-center gap-3 pt-2">
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-20 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
