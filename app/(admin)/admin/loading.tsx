// Dashboard (overview) loading skeleton
// Layout: header → 12 KPI cards → 2 charts side-by-side → recent-tenants table
export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-72 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
          <div className="h-4 w-[460px] max-w-full bg-[var(--bg-tertiary)] rounded-md animate-pulse opacity-60" />
        </div>
      </div>

      {/* 12-column KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="glass-card p-4 hover:transform-none flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-[var(--bg-tertiary)] rounded animate-pulse" />
              <div className="w-7 h-7 rounded-lg bg-[var(--bg-tertiary)] animate-pulse" />
            </div>
            <div
              className="h-6 w-14 bg-[var(--bg-tertiary)] rounded-md mt-3 animate-pulse"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          </div>
        ))}
      </div>

      {/* Charts row: line chart + pie chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-5 hover:transform-none space-y-3">
          <div className="h-4 w-48 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          <div className="h-[230px] bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
        </div>
        <div className="glass-card p-5 hover:transform-none space-y-3">
          <div className="h-4 w-36 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          <div className="h-[230px] bg-[var(--bg-tertiary)] rounded-full mx-auto w-[180px] animate-pulse" />
        </div>
      </div>

      {/* Recent Tenants Table */}
      <div className="glass-card p-5 hover:transform-none">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-52 bg-[var(--bg-tertiary)] rounded-md animate-pulse" />
          <div className="h-4 w-28 bg-[var(--bg-tertiary)] rounded animate-pulse" />
        </div>
        <div className="space-y-0">
          {/* Table header */}
          <div className="flex items-center gap-4 pb-3 border-b border-[var(--border-primary)]">
            {[140, 120, 60, 50, 50, 80].map((w, i) => (
              <div key={i} className={`h-3 bg-[var(--bg-tertiary)] rounded animate-pulse flex-shrink-0`} style={{ width: w }} />
            ))}
          </div>
          {/* Table rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 py-3 border-b border-[var(--border-primary)] last:border-0"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="h-4 w-36 bg-[var(--bg-tertiary)] rounded animate-pulse flex-shrink-0" />
              <div className="space-y-1 flex-shrink-0" style={{ width: 120 }}>
                <div className="h-3 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse" />
                <div className="h-2.5 w-32 bg-[var(--bg-tertiary)] rounded animate-pulse opacity-60" />
              </div>
              <div className="h-5 w-14 bg-[var(--bg-tertiary)] rounded-full animate-pulse flex-shrink-0" />
              <div className="h-4 w-8 bg-[var(--bg-tertiary)] rounded animate-pulse flex-shrink-0 mx-auto" />
              <div className="h-4 w-8 bg-[var(--bg-tertiary)] rounded animate-pulse flex-shrink-0 mx-auto" />
              <div className="h-3 w-20 bg-[var(--bg-tertiary)] rounded animate-pulse flex-shrink-0 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
