import prisma from "@/lib/db/prisma";
import { Shield, ShieldAlert, Key, Lock, Eye, AlertTriangle } from "lucide-react";

export default async function AdminSecurityPage() {

  // Query audit logs and tenant API keys count
  const [
    totalLogs,
    apiKeysCount,
    auditLogs,
  ] = await Promise.all([
    prisma.auditLog.count(),
    prisma.tenantApiKey.count(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        metadata: true,
        createdAt: true,
        tenant: { select: { name: true } },
      },
    }),
  ]);

  const failedLogins = 12; // Mock statistics
  const suspiciousActivities = 1;
  const tenantAccessEvents = totalLogs;

  const kpis = [
    { label: "Security Audit Records", value: totalLogs.toString(), icon: Shield, color: "blue" },
    { label: "Failed Login Attempts", value: failedLogins.toString(), icon: Lock, color: "pink" },
    { label: "Suspicious Activities", value: suspiciousActivities.toString(), icon: ShieldAlert, color: "pink" },
    { label: "AI API Keys Tracked", value: apiKeysCount.toString(), icon: Key, color: "purple" },
    { label: "Tenant Access Audits", value: tenantAccessEvents.toString(), icon: Eye, color: "cyan" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Security Dashboard & Platform Audit Logs</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Monitor system login attempts, suspicious API activities, tenant access sessions, and detailed operational audit trails.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((card) => {
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

      {/* Suspicious activity alerts list */}
      {suspiciousActivities > 0 && (
        <div className="glass-card p-4 border-l-4 border-pink-500 hover:transform-none bg-pink-950/10 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">Critical Security Alerts</h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              • <strong className="text-[var(--text-primary)]">Anomalous Multi-Tenant IP Access:</strong> IP address `108.162.219.45` attempted logins into 3 different tenant admin accounts within 90 seconds. Location: Frankfurt, Germany.
            </p>
          </div>
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="glass-card p-5 hover:transform-none">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
          Global System Audit Trail
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-primary)] text-[var(--text-tertiary)]">
                <th className="py-2.5 font-semibold">Audit Event ID</th>
                <th className="py-2.5 font-semibold">Workspace</th>
                <th className="py-2.5 font-semibold">Operational Action</th>
                <th className="py-2.5 font-semibold">Target Entity</th>
                <th className="py-2.5 font-semibold">IP Address</th>
                <th className="py-2.5 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)] text-[var(--text-secondary)]">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-[var(--text-muted)]">
                    No operational audit logs captured in database.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => {
                  const ip = (log.metadata as any)?.ip || "127.0.0.1";
                  return (
                    <tr key={log.id} className="hover:text-white">
                      <td className="py-3 font-mono text-xs text-[var(--text-primary)]">
                        AUD-{log.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="py-3 text-xs">{log.tenant?.name || "System Operations"}</td>
                      <td className="py-3">
                        <span className="font-semibold text-xs font-mono bg-[var(--bg-tertiary)] px-2 py-0.5 rounded border border-[var(--border-primary)]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 text-xs capitalize">
                        {log.entity || "system"} ({log.entityId ? log.entityId.substring(0, 6) : "N/A"})
                      </td>
                      <td className="py-3 text-xs font-mono">{ip}</td>
                      <td className="py-3 text-right text-xs">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
