export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-80 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
        <div className="h-4 w-[500px] max-w-full bg-[var(--bg-tertiary)] rounded-md animate-pulse opacity-60" />
      </div>

      {/* KPI Cards Grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="glass-card p-4 hover:transform-none flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-[var(--bg-tertiary)] rounded animate-pulse" />
              <div className="w-7 h-7 rounded-lg bg-[var(--bg-tertiary)] animate-pulse" />
            </div>
            <div
              className="h-6 w-16 bg-[var(--bg-tertiary)] rounded-md mt-3 animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          </div>
        ))}
      </div>

      {/* Chart area skeleton */}
      <div className="glass-card p-6 hover:transform-none">
        <div className="h-[280px] bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="glass-card p-5 hover:transform-none">
        <div className="h-5 w-52 bg-[var(--bg-tertiary)] rounded-md mb-4 animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="h-4 flex-1 bg-[var(--bg-tertiary)] rounded animate-pulse" />
              <div className="h-4 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse" />
              <div className="h-4 w-16 bg-[var(--bg-tertiary)] rounded animate-pulse" />
              <div className="h-4 w-20 bg-[var(--bg-tertiary)] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
