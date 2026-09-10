// Billing loading skeleton
// Layout: header + 2-tab switcher → 6 KPI cards → 2 charts (line MRR + plan donut) → invoices table
export default function AdminBillingLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header + Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[var(--border-primary)] pb-5 gap-4">
        <div className="space-y-2">
          <div className="h-7 w-72 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
          <div className="h-4 w-[430px] max-w-full bg-[var(--bg-tertiary)] rounded-md animate-pulse opacity-60" />
        </div>
        <div className="flex bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-1 rounded-xl shrink-0 gap-1">
          {[120, 104].map((w, i) => (
            <div
              key={i}
              className="h-8 rounded-lg bg-[var(--bg-tertiary)] animate-pulse"
              style={{ width: w, animationDelay: `${i * 70}ms` }}
            />
          ))}
        </div>
      </div>

      {/* 6 Revenue KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="glass-card p-4 hover:transform-none flex flex-col justify-between"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse" />
              <div className="w-7 h-7 rounded-lg bg-[var(--bg-tertiary)] animate-pulse" />
            </div>
            <div className="h-5 w-16 bg-[var(--bg-tertiary)] rounded-md mt-3 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Charts row: MRR timeline + plan distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-5 hover:transform-none space-y-3">
          <div className="h-4 w-44 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          <div className="h-[220px] bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
        </div>
        <div className="glass-card p-5 hover:transform-none space-y-3">
          <div className="h-4 w-36 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          <div className="h-[170px] w-[170px] rounded-full bg-[var(--bg-tertiary)] animate-pulse mx-auto" />
          <div className="space-y-2 mt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm bg-[var(--bg-tertiary)] animate-pulse" />
                <div className="h-3 w-20 bg-[var(--bg-tertiary)] rounded animate-pulse" />
                <div className="h-3 w-8 bg-[var(--bg-tertiary)] rounded animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="glass-card p-5 hover:transform-none">
        <div className="h-5 w-60 bg-[var(--bg-tertiary)] rounded-md mb-4 animate-pulse" />
        <div className="space-y-0">
          {/* Header */}
          <div className="flex items-center gap-4 pb-3 border-b border-[var(--border-primary)]">
            {[130, 110, 140, 60, 60, 80].map((w, i) => (
              <div key={i} className="h-3 bg-[var(--bg-tertiary)] rounded animate-pulse flex-shrink-0" style={{ width: w }} />
            ))}
          </div>
          {/* Rows */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 py-3 border-b border-[var(--border-primary)] last:border-0"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="h-4 w-32 bg-[var(--bg-tertiary)] rounded animate-pulse font-mono flex-shrink-0" />
              <div className="h-4 w-28 bg-[var(--bg-tertiary)] rounded animate-pulse flex-shrink-0" />
              <div className="h-4 w-36 bg-[var(--bg-tertiary)] rounded animate-pulse flex-shrink-0" />
              <div className="h-4 w-16 bg-[var(--bg-tertiary)] rounded animate-pulse flex-shrink-0 mx-auto" />
              <div className="h-5 w-14 bg-[var(--bg-tertiary)] rounded-full animate-pulse flex-shrink-0 mx-auto" />
              <div className="h-3 w-20 bg-[var(--bg-tertiary)] rounded animate-pulse flex-shrink-0 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
