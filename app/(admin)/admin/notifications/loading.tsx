// Notifications loading skeleton
// Layout: header + "Mark All Read" button → underline tabs (Unread / All) → notification cards list → threshold rules 3-col grid
export default function AdminNotificationsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
          <div className="h-4 w-[420px] max-w-full bg-[var(--bg-tertiary)] rounded-md animate-pulse opacity-60" />
        </div>
        {/* "Mark All Read" button */}
        <div className="h-9 w-36 bg-[var(--bg-tertiary)] rounded-lg animate-pulse shrink-0" />
      </div>

      {/* Underline tab bar */}
      <div className="flex border-b border-[var(--border-primary)] gap-6">
        {[100, 80].map((w, i) => (
          <div key={i} className="pb-2.5">
            <div
              className={`h-4 bg-[var(--bg-tertiary)] rounded animate-pulse ${i === 0 ? "opacity-100" : "opacity-50"}`}
              style={{ width: w }}
            />
          </div>
        ))}
      </div>

      {/* Notification cards */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`glass-card p-4 hover:transform-none flex items-start justify-between gap-4 ${
              i < 3 ? "border-l-4 border-[var(--brand-purple)] bg-[var(--brand-purple)]/5" : "opacity-70"
            }`}
            style={{ animationDelay: `${i * 55}ms` }}
          >
            <div className="flex items-start gap-3.5 min-w-0">
              {/* Type icon placeholder */}
              <div className="w-9 h-9 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] animate-pulse shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-48 bg-[var(--bg-tertiary)] rounded animate-pulse" />
                <div className="h-3 w-[320px] max-w-full bg-[var(--bg-tertiary)] rounded animate-pulse opacity-60" />
                <div className="h-3 w-28 bg-[var(--bg-tertiary)] rounded animate-pulse opacity-40 mt-1" />
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex items-center gap-1 shrink-0">
              {i < 3 && <div className="h-7 w-7 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />}
              <div className="h-7 w-7 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Threshold Rules 3-col grid */}
      <div className="glass-card p-5 hover:transform-none">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded bg-[var(--bg-tertiary)] animate-pulse" />
          <div className="h-5 w-56 bg-[var(--bg-tertiary)] rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] space-y-2"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="h-4 w-36 bg-[var(--bg-secondary)] rounded animate-pulse" />
              <div className="h-3 w-full bg-[var(--bg-secondary)] rounded animate-pulse opacity-70" />
              <div className="h-3 w-4/5 bg-[var(--bg-secondary)] rounded animate-pulse opacity-70" />
              <div className="h-5 w-24 bg-[var(--bg-secondary)] rounded-full animate-pulse mt-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
