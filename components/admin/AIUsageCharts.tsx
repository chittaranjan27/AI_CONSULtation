"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
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

interface AIUsageChartsProps {
  timelineData: Array<{
    date: string;
    tokens: number;
    voiceSeconds: number;
    voiceChars: number;
    cost: number;
  }>;
  providerData: Array<{
    name: string;
    value: number;
  }>;
}

const COLORS = ["#8b5cf6", "#3b82f6", "#06b6d4", "#ec4899", "#10b981"];

export default function AIUsageCharts({ timelineData, providerData }: AIUsageChartsProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        <div className="lg:col-span-2 glass-card p-5 h-96 bg-[var(--bg-tertiary)]/20" />
        <div className="glass-card p-5 h-96 bg-[var(--bg-tertiary)]/20" />
        <div className="lg:col-span-3 glass-card p-5 h-96 bg-[var(--bg-tertiary)]/20" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chart 1: AI Cost Trends */}
      <div className="lg:col-span-2 glass-card p-5 hover:transform-none">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
          Daily Infrastructure Costs & API Expenses
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
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

      {/* Chart 2: Provider Costs */}
      <div className="glass-card p-5 hover:transform-none">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
          AI Provider Expenses Breakdown
        </h3>
        <div className="h-80 w-full flex items-center justify-center">
          {providerData.length === 0 ? (
            <div className="text-sm text-[var(--text-tertiary)]">No provider expense logs available</div>
          ) : (
            <div className="flex flex-col items-center justify-around w-full h-full">
              <div className="w-44 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={providerData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {providerData.map((entry, index) => (
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
                      formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Cost"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 w-full mt-4">
                {providerData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-[var(--text-secondary)] font-medium uppercase">{entry.name}</span>
                    </div>
                    <span className="text-[var(--text-primary)] font-bold">${entry.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart 3: Consumption Breakdown (Tokens vs Characters vs Duration) */}
      <div className="lg:col-span-3 glass-card p-5 hover:transform-none">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
          Token & Voice Usage Timeline
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timelineData}>
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
              <Bar name="LLM Tokens (x1000)" dataKey="tokens" fill="var(--brand-purple)" radius={[4, 4, 0, 0]} />
              <Bar name="TTS Characters (x10)" dataKey="voiceChars" fill="var(--brand-blue)" radius={[4, 4, 0, 0]} />
              <Bar name="STT Audio Seconds" dataKey="voiceSeconds" fill="var(--brand-cyan)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
