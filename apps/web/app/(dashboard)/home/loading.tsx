export default function DashboardHomeLoading() {
  return (
    <div className="h-full flex flex-col px-5 py-4 lg:px-8 lg:py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between shrink-0 mb-5">
        <div>
          <div className="h-3 w-16 bg-bg-subtle rounded-md mb-2 animate-pulse" />
          <div className="h-7 w-72 bg-bg-subtle rounded-lg animate-pulse" />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-32 bg-bg-subtle rounded-xl animate-pulse" />
          <div className="h-10 w-28 bg-bg-subtle rounded-xl animate-pulse" />
          <div className="h-10 w-24 bg-bg-subtle rounded-xl animate-pulse" />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 shrink-0 mb-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-bg-card/80 px-5 py-4">
            <div className="flex items-center gap-3.5">
              <div className="size-11 rounded-xl bg-bg-subtle animate-pulse shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-16 bg-bg-subtle rounded-md animate-pulse" />
                <div className="h-7 w-20 bg-bg-subtle rounded-md animate-pulse" />
                <div className="h-3 w-24 bg-bg-subtle rounded-md animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* Activity */}
        <div className="rounded-lg border border-border bg-bg-card/80 p-5">
          <div className="h-5 w-24 bg-bg-subtle rounded-md mb-4 animate-pulse" />
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2.5">
              <div className="size-7 rounded-full bg-bg-subtle animate-pulse shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-36 bg-bg-subtle rounded-md animate-pulse" />
                <div className="h-2.5 w-20 bg-bg-subtle rounded-md animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-bg-card/80 p-5 flex flex-col justify-center">
              <div className="h-5 w-24 bg-bg-subtle rounded-md mb-1 animate-pulse" />
              <div className="h-3 w-20 bg-bg-subtle rounded-md mb-4 animate-pulse" />
              <div className="flex items-center gap-5">
                <div className="size-[120px] rounded-full bg-bg-subtle animate-pulse shrink-0" />
                <div className="space-y-2 flex-1">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex items-center gap-2.5">
                      <div className="size-3 rounded-md bg-bg-subtle animate-pulse shrink-0" />
                      <div className="h-3 w-14 bg-bg-subtle rounded-md animate-pulse flex-1" />
                      <div className="h-3 w-6 bg-bg-subtle rounded-md animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {/* Campaign reach */}
          <div className="rounded-lg border border-border bg-bg-card/80 p-5 col-span-2">
            <div className="h-5 w-32 bg-bg-subtle rounded-md mb-1 animate-pulse" />
            <div className="h-3 w-48 bg-bg-subtle rounded-md mb-4 animate-pulse" />
            <div className="grid grid-cols-3 gap-5 mb-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-16 bg-bg-subtle rounded-md animate-pulse" />
                  <div className="h-3 rounded-full bg-bg-subtle animate-pulse" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl bg-bg-subtle/70 py-3 text-center">
                  <div className="size-3.5 mx-auto mb-1.5 bg-bg-muted rounded animate-pulse" />
                  <div className="h-6 w-8 bg-bg-muted rounded-md mx-auto animate-pulse mb-1" />
                  <div className="h-2.5 w-12 bg-bg-muted rounded-md mx-auto animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
