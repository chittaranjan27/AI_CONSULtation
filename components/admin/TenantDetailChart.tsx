"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

interface TenantDetailChartProps {
  chartData: Array<{
    date: string;
    conversations: number;
    leads: number;
  }>;
}

export default function TenantDetailChart({ chartData }: TenantDetailChartProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="glass-card p-5 h-96 bg-[var(--bg-tertiary)]/20 animate-pulse" />;
  }

  return (
    <div className="glass-card p-5 hover:transform-none">
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
        Workspace Conversion Funnel (Last 30 Days)
      </h3>
      <div className="h-80 w-full">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-[var(--text-tertiary)]">
            No activity logs found for this tenant in the last 30 days.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorConvsDetail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand-purple)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--brand-purple)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLeadsDetail" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#colorConvsDetail)"
                strokeWidth={2}
              />
              <Area
                name="Leads Captured"
                type="monotone"
                dataKey="leads"
                stroke="var(--brand-blue)"
                fillOpacity={1}
                fill="url(#colorLeadsDetail)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
