// Settings loading skeleton
// Layout: header → 2-column grid → LEFT: vertical nav sidebar (5 items) | RIGHT: form panel (lg:col-span-3)
export default function AdminSettingsLoading() {
  const navItems = [120, 140, 108, 112, 136]; // approximate label widths

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-60 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
          <div className="h-4 w-[430px] max-w-full bg-[var(--bg-tertiary)] rounded-md animate-pulse opacity-60" />
        </div>
      </div>

      {/* 2-col grid: sidebar + form */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="glass-card p-3 hover:transform-none flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
          {navItems.map((w, i) => (
            <div
              key={i}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg shrink-0 ${
                i === 0 ? "bg-[var(--brand-purple)]/10 border border-[var(--brand-purple)]/20" : ""
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="w-4 h-4 rounded bg-[var(--bg-tertiary)] animate-pulse shrink-0" />
              <div
                className={`h-3 bg-[var(--bg-tertiary)] rounded animate-pulse ${
                  i === 0 ? "opacity-100" : "opacity-60"
                }`}
                style={{ width: w }}
              />
            </div>
          ))}
        </div>

        {/* Form Panel */}
        <div className="lg:col-span-3">
          <div className="glass-card p-5 hover:transform-none space-y-6">
            {/* Section title */}
            <div className="space-y-1.5">
              <div className="h-5 w-40 bg-[var(--bg-tertiary)] rounded animate-pulse" />
              <div className="h-3 w-72 bg-[var(--bg-tertiary)] rounded animate-pulse opacity-60" />
            </div>

            {/* 2-col input grid (row 1) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3 w-28 bg-[var(--bg-tertiary)] rounded animate-pulse" />
                  <div className="h-10 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
                </div>
              ))}
            </div>

            {/* 2-col input grid (row 2) — color pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3 w-32 bg-[var(--bg-tertiary)] rounded animate-pulse" />
                  <div className="flex gap-2.5">
                    <div className="w-10 h-10 rounded bg-[var(--bg-tertiary)] animate-pulse shrink-0" />
                    <div className="h-10 flex-1 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
                  </div>
                </div>
              ))}
            </div>

            {/* Toggle rows (AI providers section preview) */}
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="space-y-1">
                    <div className="h-4 w-48 bg-[var(--bg-secondary)] rounded animate-pulse" />
                    <div className="h-3 w-64 bg-[var(--bg-secondary)] rounded animate-pulse opacity-60" />
                  </div>
                  {/* Toggle switch */}
                  <div className="w-12 h-6 rounded-full bg-[var(--bg-secondary)] animate-pulse shrink-0" />
                </div>
              ))}
            </div>

            {/* Save button */}
            <div className="flex items-center justify-end border-t border-[var(--border-primary)] pt-5 mt-2">
              <div className="h-10 w-44 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
