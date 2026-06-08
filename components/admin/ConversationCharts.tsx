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

interface ConversationChartsProps {
  timelineData: Array<{
    date: string;
    conversations: number;
    responseTime: number;
  }>;
  channelData: Array<{
    name: string;
    value: number;
  }>;
}

const COLORS = ["#8b5cf6", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b"];

export default function ConversationCharts({ timelineData, channelData }: ConversationChartsProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        <div className="lg:col-span-2 glass-card p-5 h-96 bg-[var(--bg-tertiary)]/20" />
        <div className="glass-card p-5 h-96 bg-[var(--bg-tertiary)]/20" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chart 1: Chat Volume & Response Time */}
      <div className="lg:col-span-2 glass-card p-5 hover:transform-none">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
          Chat Volume & AI Latency (Response Time)
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
              <YAxis yAxisId="left" stroke="var(--brand-purple)" fontSize={12} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--brand-cyan)" fontSize={12} tickLine={false} />
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
                yAxisId="left"
                name="Chats Handled"
                type="monotone"
                dataKey="conversations"
                stroke="var(--brand-purple)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="right"
                name="Avg Latency (seconds)"
                type="monotone"
                dataKey="responseTime"
                stroke="var(--brand-cyan)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Channel Splits */}
      <div className="glass-card p-5 hover:transform-none">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
          Conversations by Channel
        </h3>
        <div className="h-80 w-full flex items-center justify-center">
          {channelData.length === 0 ? (
            <div className="text-sm text-[var(--text-tertiary)]">No channel statistics available</div>
          ) : (
            <div className="flex flex-col items-center justify-around w-full h-full">
              <div className="w-44 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {channelData.map((entry, index) => (
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
              <div className="space-y-1.5 w-full mt-4">
                {channelData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-[var(--text-secondary)] uppercase font-semibold">{entry.name}</span>
                    </div>
                    <span className="text-[var(--text-primary)] font-bold">{entry.value} chats</span>
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
