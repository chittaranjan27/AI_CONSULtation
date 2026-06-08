"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface AdminDashboardChartsProps {
  growthData: Array<{
    date: string;
    conversations: number;
    leads: number;
    cost: number;
    signups: number;
    revenue: number;
  }>;
  planData: Array<{
    name: string;
    value: number;
  }>;
}

const COLORS = ["#64748b", "#3b82f6", "#8b5cf6", "#ec4899"];

export default function AdminDashboardCharts({ growthData, planData }: AdminDashboardChartsProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        <div className="glass-card p-5 h-96 bg-[var(--bg-tertiary)]/20" />
        <div className="glass-card p-5 h-96 bg-[var(--bg-tertiary)]/20" />
        <div className="glass-card p-5 h-96 bg-[var(--bg-tertiary)]/20" />
        <div className="glass-card p-5 h-96 bg-[var(--bg-tertiary)]/20" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Revenue vs AI Cost */}
      <div className="glass-card p-5 hover:transform-none">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
          Financial Trends (Revenue vs AI Cost)
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-primary)",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line
                name="Platform Revenue ($)"
                type="monotone"
                dataKey="revenue"
                stroke="var(--brand-emerald)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                name="AI Infrastructure Cost ($)"
                type="monotone"
                dataKey="cost"
                stroke="var(--brand-pink)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Conversations vs Lead Generation */}
      <div className="glass-card p-5 hover:transform-none">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
          Engagement & Conversions (Conversations vs Leads)
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="colorConvs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand-purple)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--brand-purple)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand-blue)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--brand-blue)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-primary)",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Area
                name="Conversations"
                type="monotone"
                dataKey="conversations"
                stroke="var(--brand-purple)"
                fillOpacity={1}
                fill="url(#colorConvs)"
                strokeWidth={2}
              />
              <Area
                name="Leads Captured"
                type="monotone"
                dataKey="leads"
                stroke="var(--brand-blue)"
                fillOpacity={1}
                fill="url(#colorLeads)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3: Tenant Signup Growth */}
      <div className="glass-card p-5 hover:transform-none">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
          Tenant Growth (New Signups)
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-primary)",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar name="New Tenants Signed Up" dataKey="signups" fill="var(--brand-blue)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 4: Plan Distribution */}
      <div className="glass-card p-5 hover:transform-none">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
          Market Share (Plan Distribution)
        </h3>
        <div className="h-80 w-full flex items-center justify-center">
          {planData.length === 0 ? (
            <div className="text-sm text-[var(--text-tertiary)]">No plan data available</div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-around w-full">
              <div className="w-60 h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {planData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--bg-elevated)",
                        borderColor: "var(--border-primary)",
                        borderRadius: "8px",
                        color: "var(--text-primary)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2.5 mt-4 md:mt-0">
                {planData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2.5 text-sm">
                    <span
                      className="w-3.5 h-3.5 rounded-sm shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-[var(--text-secondary)] font-medium">{entry.name}:</span>
                    <span className="text-[var(--text-primary)] font-bold">{entry.value} tenants</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
