// Tenant detail loading skeleton
// Layout: back link → tenant profile banner (name, plan, status, meta) → 4 usage stat cards
//         → 2-col grid (chatbots list + subscription card) → leads table
export default function AdminTenantDetailLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back link */}
      <div className="h-4 w-32 bg-[var(--bg-tertiary)] rounded animate-pulse" />

      {/* Tenant profile banner */}
      <div className="glass-card p-6 hover:transform-none">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-56 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
            <div className="flex items-center gap-2 mt-1">
              <div className="h-5 w-16 bg-[var(--bg-tertiary)] rounded-full animate-pulse" />
              <div className="h-5 w-20 bg-[var(--bg-tertiary)] rounded-full animate-pulse" />
            </div>
            <div className="flex gap-4 mt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-3 w-28 bg-[var(--bg-tertiary)] rounded animate-pulse opacity-60" />
              ))}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <div className="h-9 w-28 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
            <div className="h-9 w-28 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      {/* 4 Usage Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="glass-card p-4 hover:transform-none flex flex-col justify-between"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse" />
              <div className="w-7 h-7 rounded-lg bg-[var(--bg-tertiary)] animate-pulse" />
            </div>
            <div className="h-6 w-20 bg-[var(--bg-tertiary)] rounded-md mt-3 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Activity Chart */}
      <div className="glass-card p-5 hover:transform-none space-y-3">
        <div className="h-4 w-44 bg-[var(--bg-tertiary)] rounded animate-pulse" />
        <div className="h-[200px] bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
      </div>

      {/* 2-col: Chatbots list + Subscription info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chatbots deployed */}
        <div className="lg:col-span-2 glass-card p-5 hover:transform-none space-y-3">
          <div className="h-5 w-40 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] animate-pulse" />
                <div className="space-y-1">
                  <div className="h-3.5 w-36 bg-[var(--bg-secondary)] rounded animate-pulse" />
                  <div className="h-2.5 w-24 bg-[var(--bg-secondary)] rounded animate-pulse opacity-60" />
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="h-5 w-16 bg-[var(--bg-secondary)] rounded-full animate-pulse" />
                <div className="h-3 w-20 bg-[var(--bg-secondary)] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Subscription card */}
        <div className="glass-card p-5 hover:transform-none space-y-4">
          <div className="h-5 w-32 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center border-b border-[var(--border-primary)] pb-2">
              <div className="h-3 w-28 bg-[var(--bg-tertiary)] rounded animate-pulse" />
              <div className="h-3 w-20 bg-[var(--bg-tertiary)] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card p-5 hover:transform-none">
        <div className="h-5 w-32 bg-[var(--bg-tertiary)] rounded-md mb-4 animate-pulse" />
        <div className="space-y-0">
          <div className="flex items-center gap-4 pb-3 border-b border-[var(--border-primary)]">
            {[160, 180, 80, 80, 90].map((w, i) => (
              <div key={i} className="h-3 bg-[var(--bg-tertiary)] rounded animate-pulse flex-shrink-0" style={{ width: w }} />
            ))}
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 py-3 border-b border-[var(--border-primary)] last:border-0"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="h-4 w-40 bg-[var(--bg-tertiary)] rounded animate-pulse flex-shrink-0" />
              <div className="h-4 w-44 bg-[var(--bg-tertiary)] rounded animate-pulse flex-shrink-0" />
              <div className="h-5 w-20 bg-[var(--bg-tertiary)] rounded-full animate-pulse flex-shrink-0" />
              <div className="h-5 w-16 bg-[var(--bg-tertiary)] rounded-full animate-pulse flex-shrink-0 ml-auto" />
              <div className="h-3 w-20 bg-[var(--bg-tertiary)] rounded animate-pulse flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
