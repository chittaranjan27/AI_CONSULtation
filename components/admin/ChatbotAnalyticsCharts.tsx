"use client";

import { useState, useEffect } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

interface ChatbotAnalyticsChartsProps {
  providerData: Array<{ name: string; value: number }>;
  modelData: Array<{ name: string; value: number }>;
}

const COLORS = ["#8b5cf6", "#3b82f6", "#06b6d4", "#ec4899", "#10b981", "#f59e0b"];

export default function ChatbotAnalyticsCharts({ providerData, modelData }: ChatbotAnalyticsChartsProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        <div className="glass-card p-5 h-80 bg-[var(--bg-tertiary)]/20" />
        <div className="glass-card p-5 h-80 bg-[var(--bg-tertiary)]/20" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Provider Share */}
      <div className="glass-card p-5 hover:transform-none">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
          LLM Provider Share
        </h3>
        <div className="h-64 w-full flex items-center justify-center">
          {providerData.length === 0 ? (
            <div className="text-sm text-[var(--text-tertiary)]">No provider data available</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-around w-full">
              <div className="w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={providerData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
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
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-4 sm:mt-0">
                {providerData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2.5 text-xs">
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-[var(--text-secondary)] font-medium uppercase">{entry.name}:</span>
                    <span className="text-[var(--text-primary)] font-bold">{entry.value} bots</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Model Share */}
      <div className="glass-card p-5 hover:transform-none">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
          AI Model Distribution
        </h3>
        <div className="h-64 w-full flex items-center justify-center">
          {modelData.length === 0 ? (
            <div className="text-sm text-[var(--text-tertiary)]">No model data available</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-around w-full">
              <div className="w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={modelData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {modelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
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
              <div className="space-y-1.5 mt-4 sm:mt-0">
                {modelData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2.5 text-xs">
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }}
                    />
                    <span className="text-[var(--text-secondary)] font-medium">{entry.name}:</span>
                    <span className="text-[var(--text-primary)] font-bold">{entry.value} bots</span>
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
