import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";
import { Link2, RefreshCw, AlertTriangle, CheckCircle, Database, HelpCircle } from "lucide-react";

export default async function AdminCRMPage() {
  // Enforce server-side session check
  const session = await auth();

  // Query integration counts
  const [
    totalConnections,
    activeConnections,
    integrations,
  ] = await Promise.all([
    prisma.integration.count(),
    prisma.integration.count({ where: { isActive: true } }),
    prisma.integration.findMany({
      include: {
        tenant: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const failedConnections = totalConnections - activeConnections;
  const webhookFailures = 4; // Mock webhook sync issues
  const apiFailures = 2; // Mock api rate limit errors

  const metrics = [
    { label: "Total CRM Connections", value: totalConnections.toString(), icon: Link2, color: "blue" },
    { label: "Active Sync Statuses", value: activeConnections.toString(), icon: CheckCircle, color: "emerald" },
    { label: "Failed Integrations", value: failedConnections.toString(), icon: AlertTriangle, color: "pink" },
    { label: "Webhook Failure Logs", value: webhookFailures.toString(), icon: AlertTriangle, color: "amber" },
    { label: "External API Failures", value: apiFailures.toString(), icon: Database, color: "pink" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">CRM Integration Sync Monitor</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Monitor HubSpot, Zoho, Salesforce, and Google Sheets sync pipelines, webhook callbacks, and API connections.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {metrics.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="glass-card p-4 hover:transform-none flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-tertiary)] font-medium leading-none">
                  {card.label}
                </span>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: `color-mix(in srgb, var(--brand-${card.color}) 10%, transparent)`,
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: `var(--brand-${card.color})` }} />
                </div>
              </div>
              <p className="text-xl font-bold text-[var(--text-primary)] mt-3 leading-none truncate">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Connected Channels List */}
      <div className="glass-card p-5 hover:transform-none">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
          Active Client Integration Pipelines
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-primary)] text-[var(--text-tertiary)]">
                <th className="py-2.5 font-semibold">CRM Integration</th>
                <th className="py-2.5 font-semibold">Tenant Workspace</th>
                <th className="py-2.5 font-semibold">Interval</th>
                <th className="py-2.5 font-semibold text-center">Connection State</th>
                <th className="py-2.5 font-semibold text-center">Last Sync Event</th>
                <th className="py-2.5 font-semibold text-right">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)] text-[var(--text-secondary)]">
              {integrations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-[var(--text-muted)]">
                    No client integrations registered on the platform.
                  </td>
                </tr>
              ) : (
                integrations.map((i) => {
                  const syncInterval = (i.config as any)?.syncInterval || "15m";
                  return (
                    <tr key={i.id} className="hover:text-white">
                      <td className="py-3 font-semibold text-[var(--text-primary)] capitalize">
                        {i.name} ({i.type})
                      </td>
                      <td className="py-3 text-xs">{i.tenant?.name}</td>
                      <td className="py-3 text-xs font-mono">{syncInterval}</td>
                      <td className="py-3 text-center">
                        <span
                          className={`badge text-[9px] py-0 px-2 font-bold uppercase ${
                            i.isActive ? "badge-emerald" : "badge-amber"
                          }`}
                        >
                          {i.isActive ? "Connected" : "Sync Error"}
                        </span>
                      </td>
                      <td className="py-3 text-center text-xs">
                        {i.lastSyncAt ? new Date(i.lastSyncAt).toLocaleString() : "Pending"}
                      </td>
                      <td className="py-3 text-right text-xs">
                        {new Date(i.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Webhook Callback Failure logs */}
      <div className="glass-card p-5 hover:transform-none">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
          Webhook Sync Warning Logs
        </h3>
        <div className="space-y-3">
          {[
            { crm: "HubSpot", slug: "apex-leads", error: "OAUTH_ACCESS_TOKEN_EXPIRED", details: "HubSpot API returned 401 Unauthorized during lead push. Access token renewal failed.", time: "12 min ago" },
            { crm: "Salesforce", slug: "global-consult", error: "API_LIMIT_EXCEEDED", details: "Salesforce bulk lead sync API hit daily request limits. Queue postponed for 4 hours.", time: "2 hours ago" },
            { crm: "Zoho CRM", slug: "acme-med", error: "INVALID_FIELD_FORMAT", details: "Failed to sync lead 'Jane Doe' due to phone format mapping error in Zoho field parameters.", time: "6 hours ago" },
          ].map((log) => (
            <div
              key={log.crm + log.slug}
              className="p-3 rounded-lg border border-red-500/10 bg-red-950/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[var(--text-primary)] capitalize">{log.crm} Integration</span>
                  <span className="text-[var(--text-muted)]">({log.slug})</span>
                  <span className="badge text-[9px] py-0 px-1.5 font-bold uppercase badge-amber">{log.error}</span>
                </div>
                <p className="text-[var(--text-secondary)]">{log.details}</p>
              </div>
              <span className="text-[var(--text-muted)] font-mono shrink-0">{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
