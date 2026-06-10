"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  MessageSquare,
  Sparkles,
  Play,
} from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-[var(--nav-height)]">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-mesh" />
      <div className="absolute inset-0 dot-pattern opacity-30" />

      {/* Animated Orbs */}
      <div
        className="glow-orb w-[500px] h-[500px] bg-purple-500/10 top-[-10%] left-[-10%]"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="glow-orb w-[400px] h-[400px] bg-blue-500/10 bottom-[-5%] right-[-5%]"
        style={{ animationDelay: "3s" }}
      />
      <div
        className="glow-orb w-[300px] h-[300px] bg-cyan-500/8 top-[30%] right-[20%]"
        style={{ animationDelay: "5s" }}
      />

      <div className="container-wide relative z-10 py-20">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--border-secondary)] bg-[var(--bg-glass)] mb-8">
              <Sparkles className="w-4 h-4 text-[var(--brand-purple)]" />
              <span className="text-sm text-[var(--text-secondary)]">
                AI-Powered Consultation Platform
              </span>
              <span className="badge badge-purple text-xs">New</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6"
          >
            Turn Every
            <br />
            <span className="gradient-text">Conversation</span> Into a
            <br />
            Qualified Lead
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mb-10 leading-relaxed"
          >
            Build AI consultation assistants, embed them anywhere, capture leads
            intelligently, and scale your business with automated workflows —
            all from one powerful platform.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 mb-16"
          >
            <Link
              href="/register"
              className="btn-primary text-base py-3.5 px-8"
            >
              Start Building Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#demo" className="btn-secondary text-base py-3.5 px-8">
              <Play className="w-4 h-4" />
              Watch Demo
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-8 sm:gap-16 mb-20"
          >
            {[
              { value: "50K+", label: "Conversations" },
              { value: "12K+", label: "Leads Captured" },
              { value: "98%", label: "Satisfaction" },
              { value: "3.2s", label: "Avg Response" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold gradient-text">
                  {stat.value}
                </div>
                <div className="text-sm text-[var(--text-tertiary)] mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Chat Preview */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5 }}
            className="relative w-full max-w-4xl mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent z-20 pointer-events-none" />
            <div className="glow-purple rounded-2xl">
              <div className="glass-card p-1 rounded-2xl hover:transform-none">
                {/* Browser Chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-primary)]">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 rounded-md bg-[var(--bg-tertiary)] text-xs text-[var(--text-tertiary)] font-mono">
                      aiassist.ai/dashboard
                    </div>
                  </div>
                </div>

                {/* Dashboard Preview */}
                <div className="p-6 bg-[var(--bg-secondary)] rounded-b-xl min-h-[400px]">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Stat Cards */}
                    {[
                      {
                        label: "Total Conversations",
                        value: "2,847",
                        change: "+12.5%",
                        color: "purple",
                      },
                      {
                        label: "Leads Captured",
                        value: "634",
                        change: "+8.3%",
                        color: "blue",
                      },
                      {
                        label: "Conversion Rate",
                        value: "22.3%",
                        change: "+3.1%",
                        color: "emerald",
                      },
                    ].map((card) => (
                      <div
                        key={card.label}
                        className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"
                      >
                        <p className="text-xs text-[var(--text-tertiary)] mb-1">
                          {card.label}
                        </p>
                        <div className="flex items-end gap-2">
                          <span className="text-2xl font-bold text-[var(--text-primary)]">
                            {card.value}
                          </span>
                          <span className={`text-xs font-medium text-[var(--brand-${card.color})]`}>
                            {card.change}
                          </span>
                        </div>
                        {/* Mini chart line */}
                        <div className="mt-3 h-8 flex items-end gap-0.5">
                          {[40, 55, 45, 60, 50, 70, 65, 80, 75, 90, 85, 95].map(
                            (h, i) => (
                              <div
                                key={i}
                                className="flex-1 rounded-sm opacity-60"
                                style={{
                                  height: `${h}%`,
                                  background: `var(--brand-${card.color})`,
                                }}
                              />
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chat + Sidebar */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Conversation list */}
                    <div className="md:col-span-2 p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                      <p className="text-sm font-semibold mb-3 text-[var(--text-primary)]">
                        Recent Conversations
                      </p>
                      {[
                        { name: "Sarah K.", msg: "Looking for enterprise plan...", time: "2m", status: "active" },
                        { name: "James R.", msg: "How does the AI training work?", time: "5m", status: "active" },
                        { name: "Priya M.", msg: "Need help with integration", time: "12m", status: "closed" },
                      ].map((conv, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-3 p-2.5 rounded-lg mb-1.5 ${i === 0
                              ? "bg-purple-500/10 border border-purple-500/20"
                              : "hover:bg-[var(--bg-glass-hover)]"
                            } transition-colors cursor-pointer`}
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {conv.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                {conv.name}
                              </p>
                              <span className="text-[10px] text-[var(--text-tertiary)]">
                                {conv.time}
                              </span>
                            </div>
                            <p className="text-xs text-[var(--text-tertiary)] truncate">
                              {conv.msg}
                            </p>
                          </div>
                          {conv.status === "active" && (
                            <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Active Chat */}
                    <div className="md:col-span-3 p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                      <div className="flex items-center gap-2 mb-4">
                        <Bot className="w-5 h-5 text-[var(--brand-purple)]" />
                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                          AI Assistant
                        </span>
                        <span className="badge badge-emerald text-[10px]">
                          Online
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                            <Bot className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div className="px-3 py-2 rounded-xl rounded-tl-none bg-[var(--bg-elevated)] text-sm text-[var(--text-secondary)] max-w-[80%]">
                            Hi Sarah! Welcome to our consultation. I&apos;d love
                            to help you find the perfect plan. What&apos;s your
                            primary use case?
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <div className="px-3 py-2 rounded-xl rounded-tr-none bg-gradient-to-br from-purple-600 to-blue-600 text-sm text-white max-w-[80%]">
                            We need a solution for our customer support team of
                            50+ agents
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                            <Bot className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div className="px-3 py-2 rounded-xl rounded-tl-none bg-[var(--bg-elevated)] text-sm text-[var(--text-secondary)] max-w-[80%]">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
                              <div
                                className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              />
                              <div
                                className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
