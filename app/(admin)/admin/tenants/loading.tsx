// Tenants list loading skeleton
// Layout: header → search/filter bar → tenant table rows with avatar, plan badge, counts, status badge, actions
export default function AdminTenantsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-52 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
          <div className="h-4 w-[380px] max-w-full bg-[var(--bg-tertiary)] rounded-md animate-pulse opacity-60" />
        </div>
        {/* Action button */}
        <div className="h-9 w-36 bg-[var(--bg-tertiary)] rounded-lg animate-pulse shrink-0" />
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="h-10 flex-1 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
        <div className="h-10 w-36 bg-[var(--bg-tertiary)] rounded-lg animate-pulse shrink-0" />
        <div className="h-10 w-28 bg-[var(--bg-tertiary)] rounded-lg animate-pulse shrink-0" />
      </div>

      {/* Tenants Table */}
      <div className="glass-card p-0 overflow-hidden hover:transform-none">
        {/* Table header */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
          {[180, 160, 70, 60, 60, 80, 90].map((w, i) => (
            <div key={i} className="h-3 bg-[var(--bg-tertiary)] rounded animate-pulse flex-shrink-0" style={{ width: w }} />
          ))}
        </div>

        {/* Tenant rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-4 border-b border-[var(--border-primary)] last:border-0"
            style={{ animationDelay: `${i * 45}ms` }}
          >
            {/* Tenant name + slug */}
            <div className="space-y-1 flex-shrink-0" style={{ width: 180 }}>
              <div className="h-4 w-36 bg-[var(--bg-tertiary)] rounded animate-pulse" />
              <div className="h-2.5 w-28 bg-[var(--bg-tertiary)] rounded animate-pulse opacity-60" />
            </div>
            {/* Owner email */}
            <div className="space-y-1 flex-shrink-0" style={{ width: 160 }}>
              <div className="h-3 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse" />
              <div className="h-2.5 w-32 bg-[var(--bg-tertiary)] rounded animate-pulse opacity-60" />
            </div>
            {/* Plan badge */}
            <div className="h-5 w-16 bg-[var(--bg-tertiary)] rounded-full animate-pulse flex-shrink-0" />
            {/* Chatbots count */}
            <div className="h-4 w-8 bg-[var(--bg-tertiary)] rounded animate-pulse flex-shrink-0 mx-auto" />
            {/* Leads count */}
            <div className="h-4 w-8 bg-[var(--bg-tertiary)] rounded animate-pulse flex-shrink-0 mx-auto" />
            {/* Created date */}
            <div className="h-3 w-20 bg-[var(--bg-tertiary)] rounded animate-pulse flex-shrink-0" />
            {/* Status badge + action buttons */}
            <div className="flex items-center gap-2 ml-auto shrink-0">
              <div className="h-5 w-16 bg-[var(--bg-tertiary)] rounded-full animate-pulse" />
              <div className="h-7 w-7 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
              <div className="h-7 w-7 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination row */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-40 bg-[var(--bg-tertiary)] rounded animate-pulse" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-8 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
