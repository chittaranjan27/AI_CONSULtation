"use client";
import { Plug, Search } from "lucide-react";

const integrations = [
  { name: "OpenAI", category: "AI Provider", status: "connected", color: "#10a37f" },
  { name: "Anthropic", category: "AI Provider", status: "connected", color: "#d4a27f" },
  { name: "HubSpot", category: "CRM", status: "disconnected", color: "#ff7a59" },
  { name: "Google Sheets", category: "Data", status: "disconnected", color: "#34a853" },
  { name: "Calendly", category: "Calendar", status: "disconnected", color: "#006bff" },
  { name: "Slack", category: "Messaging", status: "connected", color: "#4a154b" },
  { name: "Zapier", category: "Automation", status: "disconnected", color: "#ff4f00" },
  { name: "Stripe", category: "Billing", status: "connected", color: "#635bff" },
];

export default function IntegrationsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Integrations</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Connect your favorite tools and services</p>
      </div>

      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] max-w-md">
        <Search className="w-4 h-4 text-[var(--text-muted)]" />
        <input type="text" placeholder="Search integrations..." className="bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none flex-1" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {integrations.map((int) => (
          <div key={int.name} className="glass-card p-5 hover:transform-none">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold" style={{ background: `${int.color}20`, color: int.color }}>
                {int.name[0]}
              </div>
              <span className={`badge text-[10px] ${int.status === "connected" ? "badge-emerald" : "badge-blue"}`}>{int.status}</span>
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-0.5">{int.name}</h3>
            <p className="text-xs text-[var(--text-tertiary)] mb-4">{int.category}</p>
            <button className={`w-full text-sm py-2 rounded-lg font-medium transition-colors ${int.status === "connected" ? "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]" : "bg-purple-500/10 text-[var(--brand-purple)] hover:bg-purple-500/20 border border-purple-500/20"}`}>
              {int.status === "connected" ? "Configure" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
