"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface HealthChartsProps {
  timelineData: Array<{
    time: string;
    cpu: number;
    ram: number;
    dbLatency: number;
  }>;
}

export default function HealthCharts({ timelineData }: HealthChartsProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        <div className="glass-card p-5 h-96 bg-[var(--bg-tertiary)]/20" />
        <div className="glass-card p-5 h-96 bg-[var(--bg-tertiary)]/20" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* CPU & RAM Usage Chart */}
      <div className="glass-card p-5 hover:transform-none">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
          CPU & RAM Memory Loads (Last 30 Mins)
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand-blue)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--brand-blue)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand-purple)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--brand-purple)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} unit="%" />
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
                name="CPU Utilization (%)"
                type="monotone"
                dataKey="cpu"
                stroke="var(--brand-blue)"
                fillOpacity={1}
                fill="url(#cpuGrad)"
                strokeWidth={2}
              />
              <Area
                name="RAM Utilization (%)"
                type="monotone"
                dataKey="ram"
                stroke="var(--brand-purple)"
                fillOpacity={1}
                fill="url(#ramGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Database Latency Chart */}
      <div className="glass-card p-5 hover:transform-none">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
          Database Query response Latency (Last 30 Mins)
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} unit=" ms" />
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
                name="DB Latency (ms)"
                type="monotone"
                dataKey="dbLatency"
                stroke="var(--brand-pink)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
