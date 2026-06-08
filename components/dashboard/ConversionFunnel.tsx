"use client";

import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { TrendingUp, Users, Target, MessageSquare, Award } from "lucide-react";

interface ConversionFunnelProps {
  totalConversations: number;
  engagedConversations: number;
  leadsCaptured: number;
  qualifiedLeads: number;
}

export default function ConversionFunnel({
  totalConversations,
  engagedConversations,
  leadsCaptured,
  qualifiedLeads,
}: ConversionFunnelProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Safe math to avoid division by zero
  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const data = [
    {
      stage: "Conversations",
      count: totalConversations,
      percentage: 100,
      color: "var(--brand-purple)",
      gradientId: "funnelPurple",
      icon: MessageSquare,
      description: "Total chat sessions started",
    },
    {
      stage: "Engaged Chats",
      count: engagedConversations,
      percentage: getPercentage(engagedConversations, totalConversations),
      color: "var(--brand-blue)",
      gradientId: "funnelBlue",
      icon: Users,
      description: "Chats with at least one back-and-forth response",
    },
    {
      stage: "Leads Captured",
      count: leadsCaptured,
      percentage: getPercentage(leadsCaptured, totalConversations),
      color: "var(--brand-cyan)",
      gradientId: "funnelCyan",
      icon: Target,
      description: "Visitors who submitted contact information",
    },
    {
      stage: "Qualified Leads",
      count: qualifiedLeads,
      percentage: getPercentage(qualifiedLeads, totalConversations),
      color: "var(--brand-emerald)",
      gradientId: "funnelEmerald",
      icon: Award,
      description: "Leads meeting qualification scoring criteria",
    },
  ];

  // Calculate overall conversion rate (Qualified Leads / Total Conversations)
  const overallConversionRate = totalConversations > 0 
    ? ((qualifiedLeads / totalConversations) * 100).toFixed(1)
    : "0.0";

  // Step-by-step conversion drop-offs
  const stepConversionRates = [
    {
      from: "Sessions",
      to: "Engaged",
      rate: getPercentage(engagedConversations, totalConversations),
    },
    {
      from: "Engaged",
      to: "Leads",
      rate: getPercentage(leadsCaptured, engagedConversations),
    },
    {
      from: "Leads",
      to: "Qualified",
      rate: getPercentage(qualifiedLeads, leadsCaptured),
    },
  ];

  return (
    <div className="glass-card p-6 hover:transform-none h-full flex flex-col justify-between relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[150px] h-[150px] bg-purple-500/5 rounded-full blur-[50px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[150px] h-[150px] bg-emerald-500/5 rounded-full blur-[50px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-primary)]/50 pb-4 mb-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--brand-purple)]" />
            Consultation Conversion Funnel
          </h3>
          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
            Audit visitor progression and qualification drop-offs
          </p>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider block font-bold">Overall Conv. Rate</span>
          <span className="text-base font-extrabold text-[var(--brand-emerald)] font-mono">{overallConversionRate}%</span>
        </div>
      </div>

      {/* Funnel Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center flex-1">
        {/* Chart Column (col-span-8) */}
        <div className="lg:col-span-7 h-56 w-full flex items-center relative">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data}
                margin={{ top: 10, right: 35, left: 10, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="funnelPurple" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(168, 85, 247, 0.15)" />
                    <stop offset="100%" stopColor="rgba(168, 85, 247, 0.85)" />
                  </linearGradient>
                  <linearGradient id="funnelBlue" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(59, 130, 246, 0.15)" />
                    <stop offset="100%" stopColor="rgba(59, 130, 246, 0.85)" />
                  </linearGradient>
                  <linearGradient id="funnelCyan" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(6, 182, 212, 0.15)" />
                    <stop offset="100%" stopColor="rgba(6, 182, 212, 0.85)" />
                  </linearGradient>
                  <linearGradient id="funnelEmerald" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(16, 185, 129, 0.15)" />
                    <stop offset="100%" stopColor="rgba(16, 185, 129, 0.85)" />
                  </linearGradient>
                </defs>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="stage"
                  stroke="var(--text-muted)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={85}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] p-3 rounded-xl shadow-xl text-xs max-w-[200px]">
                          <p className="font-bold text-[var(--text-primary)]">{item.stage}</p>
                          <p className="text-[10px] text-[var(--text-secondary)] mt-1">{item.description}</p>
                          <div className="mt-2 pt-1 border-t border-[var(--border-primary)]/50 flex justify-between">
                            <span className="text-[var(--text-muted)]">Count:</span>
                            <span className="font-bold font-mono text-[var(--text-primary)]">{item.count.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--text-muted)]">Conversion:</span>
                            <span className="font-bold font-mono text-[var(--brand-purple)]">{item.percentage}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={22}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#${entry.gradientId})`} />
                  ))}
                  <LabelList
                    dataKey="percentage"
                    position="right"
                    formatter={(val: any) => `${val}%`}
                    style={{ fill: "var(--text-secondary)", fontSize: 10, fontWeight: "bold", fontFamily: "monospace" }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-56 flex items-center justify-center text-xs text-[var(--text-muted)]">
              Loading chart data...
            </div>
          )}
        </div>

        {/* Step Progression Analysis Column (col-span-4) */}
        <div className="lg:col-span-5 space-y-3">
          <h4 className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
            Step Progression Rates
          </h4>
          <div className="space-y-2">
            {stepConversionRates.map((step, idx) => {
              const prevItem = data[idx];
              const currentItem = data[idx + 1];
              const IconFrom = prevItem.icon;
              const IconTo = currentItem.icon;

              return (
                <div 
                  key={idx}
                  className="p-2.5 rounded-xl bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)]/40 flex items-center justify-between text-xs transition-colors hover:border-[var(--border-secondary)]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `color-mix(in srgb, ${currentItem.color} 10%, transparent)` }}
                    >
                      <IconTo className="w-3.5 h-3.5" style={{ color: currentItem.color }} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-[var(--text-muted)] block font-semibold uppercase tracking-wider">
                        {step.from} → {step.to}
                      </span>
                      <span className="font-bold text-[var(--text-primary)] block mt-0.5 truncate">
                        {currentItem.count.toLocaleString()} / {prevItem.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-extrabold font-mono text-[var(--text-primary)]">
                      {step.rate}%
                    </span>
                    <span className="text-[8px] text-[var(--text-muted)] block font-medium mt-0.5">through</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
