"use client";

import {
  ResponsiveContainer,
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

interface RevenueChartsProps {
  timelineData: Array<{
    date: string;
    mrr: number;
    subscribers: number;
  }>;
  planData: Array<{
    name: string;
    value: number;
  }>;
}

const COLORS = ["#64748b", "#3b82f6", "#8b5cf6", "#ec4899"];

export default function RevenueCharts({ timelineData, planData }: RevenueChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Revenue growth timeline */}
      <div className="lg:col-span-2 glass-card p-5 hover:transform-none">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
          Monthly Recurring Revenue (MRR) Growth
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand-emerald)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--brand-emerald)" stopOpacity={0} />
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
                formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "MRR"]}
              />
              <Legend verticalAlign="top" height={36} />
              <Area
                name="Monthly Recurring Revenue ($)"
                type="monotone"
                dataKey="mrr"
                stroke="var(--brand-emerald)"
                fillOpacity={1}
                fill="url(#mrrGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Plan Distribution Pie */}
      <div className="glass-card p-5 hover:transform-none">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
          Revenue Split by Plan
        </h3>
        <div className="h-80 w-full flex items-center justify-center">
          {planData.length === 0 ? (
            <div className="text-sm text-[var(--text-tertiary)]">No billing plan metrics available</div>
          ) : (
            <div className="flex flex-col items-center justify-around w-full h-full">
              <div className="w-44 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
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
              <div className="space-y-1.5 w-full mt-4">
                {planData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-[var(--text-secondary)] font-medium uppercase">{entry.name}</span>
                    </div>
                    <span className="text-[var(--text-primary)] font-bold">{entry.value} subscribers</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subscriber base growth bar */}
      <div className="lg:col-span-3 glass-card p-5 hover:transform-none">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
          Paying Subscriber Base Growth
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
              <Bar name="Active Subscribers" dataKey="subscribers" fill="var(--brand-blue)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
