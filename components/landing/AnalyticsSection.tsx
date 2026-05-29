"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  MessageSquare,
  Target,
  DollarSign,
  Clock,
} from "lucide-react";

function AnimatedCounter({
  end,
  suffix = "",
  prefix = "",
  duration = 2,
}: {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const increment = end / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [isInView, end, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

const analyticsData = [
  { day: "Mon", chats: 45, leads: 12 },
  { day: "Tue", chats: 52, leads: 18 },
  { day: "Wed", chats: 68, leads: 22 },
  { day: "Thu", chats: 55, leads: 15 },
  { day: "Fri", chats: 78, leads: 28 },
  { day: "Sat", chats: 42, leads: 10 },
  { day: "Sun", chats: 38, leads: 8 },
];

const maxChats = Math.max(...analyticsData.map((d) => d.chats));

export default function AnalyticsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="analytics" className="section relative" ref={ref}>
      <div className="absolute inset-0 bg-mesh opacity-50" />
      <div className="container-wide relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="badge badge-blue mb-4">Analytics</div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Data-Driven{" "}
            <span className="gradient-text">Decision Making</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">
            Real-time dashboards that track every conversation, lead, conversion,
            and AI cost — so you always know what&apos;s working.
          </p>
        </motion.div>

        {/* Analytics Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Metrics Column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4"
          >
            {[
              {
                icon: MessageSquare,
                label: "Total Conversations",
                value: 2847,
                change: "+12.5%",
                color: "purple",
              },
              {
                icon: Target,
                label: "Leads Captured",
                value: 634,
                change: "+8.3%",
                color: "blue",
              },
              {
                icon: TrendingUp,
                label: "Conversion Rate",
                value: 22,
                suffix: "%",
                change: "+3.1%",
                color: "emerald",
              },
              {
                icon: Clock,
                label: "Avg Response Time",
                value: 3,
                suffix: ".2s",
                change: "-0.5s",
                color: "cyan",
              },
              {
                icon: DollarSign,
                label: "AI Cost Saved",
                value: 4200,
                prefix: "$",
                change: "+18%",
                color: "amber",
              },
              {
                icon: Users,
                label: "Returning Users",
                value: 78,
                suffix: "%",
                change: "+5.2%",
                color: "pink",
              },
            ].map((metric, i) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                  className="glass-card p-4 flex items-center gap-4 hover:transform-none"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0`}
                    style={{
                      background: `color-mix(in srgb, var(--brand-${metric.color}) 15%, transparent)`,
                    }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: `var(--brand-${metric.color})` }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {metric.label}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-[var(--text-primary)]">
                        <AnimatedCounter
                          end={metric.value}
                          suffix={metric.suffix || ""}
                          prefix={metric.prefix || ""}
                        />
                      </span>
                      <span className="text-xs font-medium text-[var(--brand-emerald)]">
                        {metric.change}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Chart Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="glass-card p-6 h-full hover:transform-none">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Weekly Performance
                  </h3>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    Conversations vs Leads captured
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[var(--brand-purple)]" />
                    <span className="text-[var(--text-secondary)]">Chats</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[var(--brand-cyan)]" />
                    <span className="text-[var(--text-secondary)]">Leads</span>
                  </div>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="flex items-end gap-3 h-[260px] px-2">
                {analyticsData.map((data, i) => (
                  <div key={data.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-full flex gap-1 items-end flex-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={isInView ? { height: `${(data.chats / maxChats) * 100}%` } : {}}
                        transition={{ duration: 0.6, delay: 0.5 + i * 0.05 }}
                        className="flex-1 rounded-t-md bg-gradient-to-t from-purple-600 to-purple-400 opacity-80 min-h-[4px]"
                      />
                      <motion.div
                        initial={{ height: 0 }}
                        animate={isInView ? { height: `${(data.leads / maxChats) * 100}%` } : {}}
                        transition={{ duration: 0.6, delay: 0.6 + i * 0.05 }}
                        className="flex-1 rounded-t-md bg-gradient-to-t from-cyan-600 to-cyan-400 opacity-80 min-h-[4px]"
                      />
                    </div>
                    <span className="text-[11px] text-[var(--text-tertiary)]">
                      {data.day}
                    </span>
                  </div>
                ))}
              </div>

              {/* Funnel Preview */}
              <div className="mt-8 pt-6 border-t border-[var(--border-primary)]">
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
                  Conversion Funnel
                </h4>
                <div className="space-y-2">
                  {[
                    { label: "Page Visits", value: 12400, pct: 100 },
                    { label: "Widget Opens", value: 4200, pct: 34 },
                    { label: "Conversations", value: 2847, pct: 23 },
                    { label: "Leads Captured", value: 634, pct: 5.1 },
                    { label: "Converted", value: 142, pct: 1.1 },
                  ].map((step, i) => (
                    <div key={step.label} className="flex items-center gap-3">
                      <span className="text-xs text-[var(--text-tertiary)] w-28 shrink-0">
                        {step.label}
                      </span>
                      <div className="flex-1 h-6 bg-[var(--bg-tertiary)] rounded-md overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={isInView ? { width: `${step.pct}%` } : {}}
                          transition={{ duration: 0.8, delay: 0.8 + i * 0.1 }}
                          className="h-full rounded-md"
                          style={{
                            background: `linear-gradient(90deg, var(--brand-purple), var(--brand-blue))`,
                            opacity: 1 - i * 0.15,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-[var(--text-secondary)] w-14 text-right">
                        {step.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
