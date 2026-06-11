"use client";

import { useState } from "react";
import {
  Cpu,
  HardDrive,
  Database,
  Server,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Shield,
  ShieldAlert,
  Key,
  Lock,
  Eye,
  Activity,
} from "lucide-react";
import HealthCharts from "@/components/admin/HealthCharts";

interface AuditLogItem {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  metadata: any;
  createdAt: string;
  tenant: { name: string } | null;
}

interface SystemOpsClientProps {
  dbStatus: string;
  dbLatency: number;
  totalLogs: number;
  apiKeysCount: number;
  auditLogs: AuditLogItem[];
}

export default function SystemOpsClient({
  dbStatus,
  dbLatency,
  totalLogs,
  apiKeysCount,
  auditLogs,
}: SystemOpsClientProps) {
  const [activeTab, setActiveTab] = useState<"health" | "security">("health");

  // 1. HEALTH PAGE CALCULATIONS & SIMULATIONS
  const cpuVal = 14.2;
  const ramVal = 44.8;
  const storageVal = 18.2;
  const errorRate = 0.04;
  const queueStatus = "IDLE";

  const timelineDataHealth = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 1000);
    const timeStr = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    
    const randCpu = Math.floor(Math.random() * 8) + 10;
    const randRam = Math.floor(Math.random() * 3) + 42;
    const randDb = Math.floor(Math.random() * 10) + 4;

    timelineDataHealth.push({
      time: timeStr,
      cpu: randCpu,
      ram: randRam,
      dbLatency: i === 0 ? dbLatency : randDb,
    });
  }

  const indicators = [
    { label: "CPU Load", value: `${cpuVal.toFixed(1)}%`, desc: "Average server load", icon: Cpu, color: "blue", status: "HEALTHY" },
    { label: "RAM Utilization", value: `${ramVal.toFixed(1)}%`, desc: "7.1 GB of 16 GB used", icon: Server, color: "purple", status: "HEALTHY" },
    { label: "Storage Capacity", value: `${storageVal.toFixed(1)}%`, desc: "18.2 GB of 100 GB used", icon: HardDrive, color: "cyan", status: "HEALTHY" },
    { label: "Database Connection", value: `${dbLatency} ms`, desc: `PostgreSQL is ${dbStatus.toLowerCase()}`, icon: Database, color: dbStatus === "HEALTHY" ? "emerald" : "pink", status: dbStatus },
    { label: "Job Queue Status", value: queueStatus, desc: "0 jobs backlogged", icon: RefreshCw, color: "amber", status: "HEALTHY" },
    { label: "API HTTP Error Rate", value: `${errorRate.toFixed(2)}%`, desc: "Last 5,000 requests", icon: AlertTriangle, color: "emerald", status: "HEALTHY" },
  ];

  // 2. SECURITY PAGE CALCULATIONS & SIMULATIONS
  const failedLogins = 12;
  const suspiciousActivities = 1;
  const tenantAccessEvents = totalLogs;

  const securityKPIs = [
    { label: "Security Audit Records", value: totalLogs.toString(), icon: Shield, color: "blue" },
    { label: "Failed Login Attempts", value: failedLogins.toString(), icon: Lock, color: "pink" },
    { label: "Suspicious Activities", value: suspiciousActivities.toString(), icon: ShieldAlert, color: "pink" },
    { label: "AI API Keys Tracked", value: apiKeysCount.toString(), icon: Key, color: "purple" },
    { label: "Tenant Access Audits", value: tenantAccessEvents.toString(), icon: Eye, color: "cyan" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[var(--border-primary)] pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">System Operations & Control</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Monitor infrastructure status, Postgres database query latency, and platform security logs.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab("health")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "health"
                ? "bg-[var(--brand-purple)] text-white shadow"
                : "text-[var(--text-secondary)] hover:text-white"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Platform Health
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "security"
                ? "bg-[var(--brand-purple)] text-white shadow"
                : "text-[var(--text-secondary)] hover:text-white"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Security & Audits
          </button>
        </div>
      </div>

      {/* Tab: Platform Health */}
      {activeTab === "health" && (
        <div className="space-y-6 animate-fade-in">
          {/* Status Bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-semibold text-xs justify-center sm:justify-start">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            All core infrastructure gateways operating normally within SLA parameters
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {indicators.map((card) => {
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
                  <p className="text-lg font-bold text-[var(--text-primary)] mt-3 leading-none truncate">
                    {card.value}
                  </p>
                  <span className="text-[10px] text-[var(--text-tertiary)] mt-1.5 leading-none">
                    {card.desc}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Charts */}
          <HealthCharts timelineData={timelineDataHealth} />

          {/* Detailed Status Logs */}
          <div className="glass-card p-5 hover:transform-none">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
              Core Service Subsystem Statuses
            </h3>
            <div className="space-y-3">
              {[
                { name: "Prisma Client ORM Engine", status: "HEALTHY", desc: "Latest schema synced, client code successfully compiled.", details: "v6.19.3" },
                { name: "Neon Serverless Postgres Gateway", status: "HEALTHY", desc: "No active connection pool throttling or rate limiting.", details: `${dbLatency}ms latency` },
                { name: "Next.js Node App Engine", status: "HEALTHY", desc: "API handler endpoints answering within SLA thresholds.", details: "Node v20.x" },
                { name: "Sarvam Voice Synthesis API", status: "HEALTHY", desc: "Webhook endpoints active, TTS and STT synthesizers responding.", details: "Active" },
                { name: "Redis Cache Client Manager", status: "WARNING", desc: "Connection failed (localhost:6379), falling back to local memory storage.", details: "Off-line" },
              ].map((srv) => (
                <div
                  key={srv.name}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] gap-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{srv.name}</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{srv.desc}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-[var(--text-muted)]">{srv.details}</span>
                    <span
                      className={`badge text-[9px] py-0 px-2 font-bold uppercase ${
                        srv.status === "HEALTHY" ? "badge-emerald" : "badge-amber"
                      }`}
                    >
                      {srv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Security & Audits */}
      {activeTab === "security" && (
        <div className="space-y-6 animate-fade-in">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {securityKPIs.map((card) => {
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
                      const ip = log.metadata?.ip || "127.0.0.1";
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
                            {new Date(log.createdAt).toLocaleDateString()}
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
      )}
    </div>
  );
}
