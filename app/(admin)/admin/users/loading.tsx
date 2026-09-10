// Users list loading skeleton
// Layout: header → search bar + role filter + tenant filter → user table rows
export default function AdminUsersLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
          <div className="h-4 w-[360px] max-w-full bg-[var(--bg-tertiary)] rounded-md animate-pulse opacity-60" />
        </div>
        <div className="h-9 w-36 bg-[var(--bg-tertiary)] rounded-lg animate-pulse shrink-0" />
      </div>

      {/* Search + Filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="h-10 flex-1 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
        <div className="h-10 w-40 bg-[var(--bg-tertiary)] rounded-lg animate-pulse shrink-0" />
        <div className="h-10 w-44 bg-[var(--bg-tertiary)] rounded-lg animate-pulse shrink-0" />
        <div className="h-10 w-28 bg-[var(--bg-tertiary)] rounded-lg animate-pulse shrink-0" />
      </div>

      {/* Users Table */}
      <div className="glass-card p-0 overflow-hidden hover:transform-none">
        {/* Table header */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
          {[160, 200, 80, 140, 100, 90].map((w, i) => (
            <div key={i} className="h-3 bg-[var(--bg-tertiary)] rounded animate-pulse flex-shrink-0" style={{ width: w }} />
          ))}
        </div>

        {/* User rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-3.5 border-b border-[var(--border-primary)] last:border-0"
            style={{ animationDelay: `${i * 35}ms` }}
          >
            {/* Name + avatar */}
            <div className="flex items-center gap-2.5 flex-shrink-0" style={{ width: 160 }}>
              <div className="w-7 h-7 rounded-full bg-[var(--bg-tertiary)] animate-pulse shrink-0" />
              <div className="h-4 flex-1 bg-[var(--bg-tertiary)] rounded animate-pulse" />
            </div>
            {/* Email */}
            <div className="h-3 w-48 bg-[var(--bg-tertiary)] rounded animate-pulse flex-shrink-0" />
            {/* Role badge */}
            <div className="h-5 w-20 bg-[var(--bg-tertiary)] rounded-full animate-pulse flex-shrink-0" />
            {/* Tenant workspace */}
            <div className="h-3 w-36 bg-[var(--bg-tertiary)] rounded animate-pulse flex-shrink-0" />
            {/* Last login */}
            <div className="h-3 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse flex-shrink-0" />
            {/* Status + actions */}
            <div className="flex items-center gap-2 ml-auto shrink-0">
              <div className="h-5 w-14 bg-[var(--bg-tertiary)] rounded-full animate-pulse" />
              <div className="h-7 w-7 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-44 bg-[var(--bg-tertiary)] rounded animate-pulse" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-8 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
