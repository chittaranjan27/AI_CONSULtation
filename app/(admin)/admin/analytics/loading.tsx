// Analytics loading skeleton
// Layout: header + tab switcher → total-cost banner → 2 charts side-by-side → 3 detail cards (LLM / STT / TTS)
export default function AdminAnalyticsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header + Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[var(--border-primary)] pb-5 gap-4">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
          <div className="h-4 w-[440px] max-w-full bg-[var(--bg-tertiary)] rounded-md animate-pulse opacity-60" />
        </div>
        {/* 3-button tab skeleton */}
        <div className="flex bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-1 rounded-xl shrink-0 gap-1">
          {[100, 120, 96].map((w, i) => (
            <div
              key={i}
              className="h-8 rounded-lg bg-[var(--bg-tertiary)] animate-pulse"
              style={{ width: w, animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      </div>

      {/* AI cost banner */}
      <div className="glass-card p-4 hover:transform-none flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-3 w-28 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          <div className="h-6 w-20 bg-[var(--bg-tertiary)] rounded-md animate-pulse" />
        </div>
        <div className="w-9 h-9 rounded-lg bg-[var(--bg-tertiary)] animate-pulse" />
      </div>

      {/* Charts row: line chart + provider donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-5 hover:transform-none space-y-3">
          <div className="h-4 w-44 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          <div className="h-[220px] bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
        </div>
        <div className="glass-card p-5 hover:transform-none space-y-3">
          <div className="h-4 w-32 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          <div className="h-[170px] w-[170px] rounded-full bg-[var(--bg-tertiary)] animate-pulse mx-auto" />
          <div className="space-y-2 mt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--bg-tertiary)] animate-pulse" />
                <div className="h-3 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse" />
                <div className="h-3 w-12 bg-[var(--bg-tertiary)] rounded animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3 detail cards: LLM / STT / TTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, ci) => (
          <div key={ci} className="glass-card p-5 hover:transform-none">
            {/* Card header */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] animate-pulse" />
              <div className="h-4 w-44 bg-[var(--bg-tertiary)] rounded animate-pulse" />
            </div>
            {/* Metric rows */}
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, mi) => (
                <div
                  key={mi}
                  className="flex justify-between items-center pb-1.5 border-b border-[var(--border-primary)]"
                  style={{ animationDelay: `${mi * 40}ms` }}
                >
                  <div className="h-3 w-32 bg-[var(--bg-tertiary)] rounded animate-pulse" />
                  <div className={`h-3 bg-[var(--bg-tertiary)] rounded animate-pulse ${mi === 3 ? "w-16" : "w-20"}`} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
