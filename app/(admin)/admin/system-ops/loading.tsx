// System Ops loading skeleton
// Layout: header + 2-tab switcher → status bar banner → 6 KPI cards (2 rows) → chart → 5 service status rows
export default function AdminSystemOpsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header + Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[var(--border-primary)] pb-5 gap-4">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
          <div className="h-4 w-[460px] max-w-full bg-[var(--bg-tertiary)] rounded-md animate-pulse opacity-60" />
        </div>
        <div className="flex bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-1 rounded-xl shrink-0 gap-1">
          {[116, 120].map((w, i) => (
            <div
              key={i}
              className="h-8 rounded-lg bg-[var(--bg-tertiary)] animate-pulse"
              style={{ width: w, animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      </div>

      {/* "All systems operational" status banner */}
      <div className="h-10 bg-[var(--bg-tertiary)] rounded-xl animate-pulse opacity-60" />

      {/* 6 Infrastructure KPI Cards (2×3 on md, 1×6 on lg) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="glass-card p-4 hover:transform-none flex flex-col justify-between"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-[var(--bg-tertiary)] rounded animate-pulse" />
              <div className="w-7 h-7 rounded-lg bg-[var(--bg-tertiary)] animate-pulse" />
            </div>
            <div className="h-5 w-16 bg-[var(--bg-tertiary)] rounded-md mt-2 animate-pulse" />
            <div className="h-2.5 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse mt-1.5 opacity-60" />
          </div>
        ))}
      </div>

      {/* Charts area: CPU/RAM/DB timeline */}
      <div className="glass-card p-5 hover:transform-none space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-48 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          <div className="flex gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--bg-tertiary)] animate-pulse" />
                <div className="h-3 w-12 bg-[var(--bg-tertiary)] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="h-[200px] bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
      </div>

      {/* Service status rows */}
      <div className="glass-card p-5 hover:transform-none space-y-3">
        <div className="h-5 w-52 bg-[var(--bg-tertiary)] rounded animate-pulse mb-1" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] gap-2"
            style={{ animationDelay: `${i * 55}ms` }}
          >
            <div className="space-y-1">
              <div className="h-4 w-56 bg-[var(--bg-secondary)] rounded animate-pulse" />
              <div className="h-3 w-80 max-w-full bg-[var(--bg-secondary)] rounded animate-pulse opacity-60" />
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="h-3 w-16 bg-[var(--bg-secondary)] rounded animate-pulse font-mono" />
              <div className="h-5 w-16 bg-[var(--bg-secondary)] rounded-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
