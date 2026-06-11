"use client";

import { useState } from "react";
import {
  Cpu,
  MessageSquare,
  PhoneCall,
  Volume2,
  DollarSign,
  Bot,
  Target,
  Sparkles,
  Users,
  CheckCircle,
  TrendingUp,
  Percent,
  BarChart3,
} from "lucide-react";
import AIUsageCharts from "@/components/admin/AIUsageCharts";
import ChatbotAnalyticsCharts from "@/components/admin/ChatbotAnalyticsCharts";
import LeadAnalyticsClient from "@/components/admin/LeadAnalyticsClient";

interface AIArg {
  count: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  audioDuration?: number;
  characterCount?: number;
  cost: number;
}

interface ProviderAI {
  provider: string;
  cost: number;
}

interface DailyStatItem {
  date: string;
  totalTokens: number;
  sttDuration: number;
  ttsCharacters: number;
  totalCost: number;
  leadsCaptured: number;
}

interface BotItem {
  id: string;
  name: string;
  status: string;
  model: string;
  aiProvider: string;
  tenant: { name: string } | null;
  conversationsCount: number;
  leadsCount: number;
}

interface LeadItem {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  score: number;
  source: string | null;
  createdAt: string;
  tenant: { name: string } | null;
  chatbot: { name: string } | null;
}

interface GroupCount {
  status?: string;
  aiProvider?: string;
  model?: string;
  source?: string | null;
  count: number;
}

interface AnalyticsManagerClientProps {
  // AI usage props
  llmAggregate: AIArg;
  sttAggregate: AIArg;
  ttsAggregate: AIArg;
  totalAICost: number;
  providerGroupAI: ProviderAI[];
  dailyStats: DailyStatItem[];

  // Chatbots props
  totalBots: number;
  botsGroupedByStatus: GroupCount[];
  providerGroupBots: GroupCount[];
  modelGroupBots: GroupCount[];
  allBots: BotItem[];

  // Leads props
  totalLeads: number;
  qualifiedLeads: number;
  wonLeads: number;
  totalConvs: number;
  sourceGroupLeads: GroupCount[];
  recentLeads: LeadItem[];
}

export default function AnalyticsManagerClient({
  llmAggregate,
  sttAggregate,
  ttsAggregate,
  totalAICost,
  providerGroupAI,
  dailyStats,

  totalBots,
  botsGroupedByStatus,
  providerGroupBots,
  modelGroupBots,
  allBots,

  totalLeads,
  qualifiedLeads,
  wonLeads,
  totalConvs,
  sourceGroupLeads,
  recentLeads,
}: AnalyticsManagerClientProps) {
  const [activeTab, setActiveTab] = useState<"ai" | "chatbot" | "leads">("ai");

  // 1. AI TIMELINE & CHART PROCESSING
  const providerDataAI = providerGroupAI.map((pg) => ({
    name: pg.provider,
    value: pg.cost,
  }));

  const dailyMapAI = new Map<
    string,
    { date: string; tokens: number; voiceSeconds: number; voiceChars: number; cost: number }
  >();

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dailyMapAI.set(dateStr, {
      date: dateStr,
      tokens: 0,
      voiceSeconds: 0,
      voiceChars: 0,
      cost: 0,
    });
  }

  dailyStats.forEach((ds) => {
    const dateStr = new Date(ds.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const dayData = dailyMapAI.get(dateStr);
    if (dayData) {
      dayData.tokens += Math.floor(ds.totalTokens / 1000); // Scale down
      dayData.voiceSeconds += Math.floor(ds.sttDuration);
      dayData.voiceChars += Math.floor(ds.ttsCharacters / 10); // Scale down
      dayData.cost += ds.totalCost;
    }
  });
  const timelineDataAI = Array.from(dailyMapAI.values());

  const aiBlocks = [
    {
      title: "Large Language Model (LLM)",
      metrics: [
        { label: "Total Requests", value: llmAggregate.count.toLocaleString() },
        { label: "Input Tokens", value: (llmAggregate.inputTokens || 0).toLocaleString() },
        { label: "Output Tokens", value: (llmAggregate.outputTokens || 0).toLocaleString() },
        { label: "Combined Tokens", value: (llmAggregate.totalTokens || 0).toLocaleString() },
        { label: "Infrastructure Cost", value: `$${llmAggregate.cost.toFixed(4)}`, highlight: true },
      ],
      icon: MessageSquare,
      color: "purple",
    },
    {
      title: "Speech-to-Text (STT / Transcription)",
      metrics: [
        { label: "Transcription Calls", value: sttAggregate.count.toLocaleString() },
        { label: "Total Audio Processed", value: `${((sttAggregate.audioDuration || 0) / 60).toFixed(2)} mins` },
        { label: "Audio Duration (Secs)", value: `${(sttAggregate.audioDuration || 0).toFixed(1)}s` },
        { label: "Infrastructure Cost", value: `$${sttAggregate.cost.toFixed(4)}`, highlight: true },
      ],
      icon: PhoneCall,
      color: "blue",
    },
    {
      title: "Text-to-Speech (TTS / Synthesis)",
      metrics: [
        { label: "Voice Synthesis Calls", value: ttsAggregate.count.toLocaleString() },
        { label: "Characters Synthesized", value: (ttsAggregate.characterCount || 0).toLocaleString() },
        { label: "Avg Chars / Request", value: ttsAggregate.count > 0 ? Math.floor((ttsAggregate.characterCount || 0) / ttsAggregate.count).toLocaleString() : "0" },
        { label: "Infrastructure Cost", value: `$${ttsAggregate.cost.toFixed(4)}`, highlight: true },
      ],
      icon: Volume2,
      color: "cyan",
    },
  ];

  // 2. CHATBOT DATA PROCESSING
  const statusMap = { ACTIVE: 0, INACTIVE: 0, DRAFT: 0 };
  botsGroupedByStatus.forEach((bg) => {
    if (bg.status && bg.status in statusMap) {
      statusMap[bg.status as keyof typeof statusMap] = bg.count;
    }
  });

  const topActiveBots = [...allBots]
    .sort((a, b) => b.conversationsCount - a.conversationsCount)
    .slice(0, 5);

  const topConvertingBots = [...allBots]
    .sort((a, b) => {
      const rateA = a.conversationsCount > 0 ? (a.leadsCount / a.conversationsCount) * 100 : 0;
      const rateB = b.conversationsCount > 0 ? (b.leadsCount / b.conversationsCount) * 100 : 0;
      return rateB - rateA;
    })
    .slice(0, 5);

  const providerDataBots = providerGroupBots.map((pg) => ({
    name: pg.aiProvider || "Unknown",
    value: pg.count,
  }));

  const modelDataBots = modelGroupBots.map((mg) => ({
    name: mg.model || "Unknown",
    value: mg.count,
  }));

  const chatbotKPIs = [
    { label: "Total Chatbots Deployed", value: totalBots, icon: Bot, color: "blue" },
    { label: "Active Agent instances", value: statusMap.ACTIVE, icon: Sparkles, color: "emerald" },
    { label: "Draft Configs", value: statusMap.DRAFT, icon: Cpu, color: "purple" },
    { label: "Inactive/Paused Bots", value: statusMap.INACTIVE, icon: MessageSquare, color: "pink" },
  ];

  // 3. LEADS DATA PROCESSING
  const conversionRate = totalConvs > 0 ? (totalLeads / totalConvs) * 100 : 0;
  const qualificationRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;

  const dailyMapLeads = new Map<string, { date: string; leads: number; qualified: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dailyMapLeads.set(dateStr, {
      date: dateStr,
      leads: 0,
      qualified: 0,
    });
  }

  dailyStats.forEach((ds) => {
    const dateStr = new Date(ds.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const dayData = dailyMapLeads.get(dateStr);
    if (dayData) {
      dayData.leads += ds.leadsCaptured;
      dayData.qualified += Math.floor(ds.leadsCaptured * 0.45);
    }
  });
  const timelineDataLeads = Array.from(dailyMapLeads.values());

  const sourceDataLeads = sourceGroupLeads.map((sg) => ({
    name: sg.source || "Organic Web",
    value: sg.count,
  }));

  const leadKPIs = [
    { label: "Total Leads Captured", value: totalLeads.toLocaleString(), icon: Users, color: "blue" },
    { label: "Qualified Leads", value: qualifiedLeads.toLocaleString(), icon: CheckCircle, color: "emerald" },
    { label: "Leads Won (Conversions)", value: wonLeads.toLocaleString(), icon: Target, color: "purple" },
    { label: "Conversion Rate (Chats to Leads)", value: `${conversionRate.toFixed(1)}%`, icon: Percent, color: "cyan" },
    { label: "Lead Qualification Ratio", value: `${qualificationRate.toFixed(1)}%`, icon: TrendingUp, color: "amber" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[var(--border-primary)] pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Analytics Control Center</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Monitor platform AI costs, chatbot performance parameters, and lead conversion rates.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-1 rounded-xl shrink-0 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === "ai"
                ? "bg-[var(--brand-purple)] text-white shadow"
                : "text-[var(--text-secondary)] hover:text-white"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            AI Costs & Usage
          </button>
          <button
            onClick={() => setActiveTab("chatbot")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === "chatbot"
                ? "bg-[var(--brand-purple)] text-white shadow"
                : "text-[var(--text-secondary)] hover:text-white"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            Chatbot Analytics
          </button>
          <button
            onClick={() => setActiveTab("leads")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === "leads"
                ? "bg-[var(--brand-purple)] text-white shadow"
                : "text-[var(--text-secondary)] hover:text-white"
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            Lead Funnels
          </button>
        </div>
      </div>

      {/* Tab: AI Costs & Usage */}
      {activeTab === "ai" && (
        <div className="space-y-6 animate-fade-in">
          {/* MTD Card Indicator */}
          <div className="flex items-center justify-between glass-card p-4 hover:transform-none bg-[var(--bg-secondary)]">
            <div>
              <p className="text-xs text-[var(--text-tertiary)] uppercase font-semibold">Total Cost (MTD)</p>
              <p className="text-xl font-extrabold text-[var(--text-primary)] mt-1">${totalAICost.toFixed(3)}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[var(--brand-pink)]/10 flex items-center justify-center text-[var(--brand-pink)]">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* Consumption Charts */}
          <AIUsageCharts timelineData={timelineDataAI} providerData={providerDataAI} />

          {/* Breakdown Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {aiBlocks.map((block) => {
              const Icon = block.icon;
              return (
                <div key={block.title} className="glass-card p-5 hover:transform-none flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2.5 mb-4">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          background: `color-mix(in srgb, var(--brand-${block.color}) 12%, transparent)`,
                        }}
                      >
                        <Icon className="w-4.5 h-4.5" style={{ color: `var(--brand-${block.color})` }} />
                      </div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">{block.title}</h3>
                    </div>

                    <div className="space-y-2.5">
                      {block.metrics.map((metric) => (
                        <div
                          key={metric.label}
                          className="flex justify-between items-center text-xs pb-1.5 border-b border-[var(--border-primary)]"
                        >
                          <span className="text-[var(--text-secondary)]">{metric.label}</span>
                          <span
                            className={`font-semibold ${
                              metric.highlight ? "text-[var(--brand-pink)] font-bold text-sm" : "text-[var(--text-primary)]"
                            }`}
                          >
                            {metric.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Chatbot Analytics */}
      {activeTab === "chatbot" && (
        <div className="space-y-6 animate-fade-in">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {chatbotKPIs.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="glass-card p-4 hover:transform-none flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-tertiary)] font-medium leading-none">
                      {card.label}
                    </span>
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: `color-mix(in srgb, var(--brand-${card.color}) 10%, transparent)`,
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color: `var(--brand-${card.color})` }} />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-[var(--text-primary)] mt-3 leading-none truncate">
                    {card.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Charts */}
          <ChatbotAnalyticsCharts providerData={providerDataBots} modelData={modelDataBots} />

          {/* Rankings Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rankings: Volume */}
            <div className="glass-card p-5 hover:transform-none">
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
                Top 5 Most Active Chatbots (Chat Volumes)
              </h3>
              <div className="space-y-3">
                {topActiveBots.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)] text-center py-4">No chatbots found.</p>
                ) : (
                  topActiveBots.map((bot, index) => (
                    <div
                      key={bot.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-purple-500/10 text-[var(--brand-purple)] font-bold text-xs flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{bot.name}</p>
                          <p className="text-[10px] text-[var(--text-tertiary)]">{bot.tenant?.name || "Deleted Tenant"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-[var(--text-primary)]">
                          {bot.conversationsCount.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-[var(--text-tertiary)]">conversations</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Rankings: Leads */}
            <div className="glass-card p-5 hover:transform-none">
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
                Top 5 Highest Converting Chatbots (Lead Rates)
              </h3>
              <div className="space-y-3">
                {topConvertingBots.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)] text-center py-4">No chatbots found.</p>
                ) : (
                  topConvertingBots.map((bot, index) => {
                    const convs = bot.conversationsCount;
                    const leads = bot.leadsCount;
                    const rate = convs > 0 ? (leads / convs) * 100 : 0;
                    return (
                      <div
                        key={bot.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-blue-500/10 text-[var(--brand-blue)] font-bold text-xs flex items-center justify-center">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">{bot.name}</p>
                            <p className="text-[10px] text-[var(--text-tertiary)]">{bot.tenant?.name || "Deleted Tenant"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-extrabold text-[var(--brand-emerald)]">{rate.toFixed(1)}%</p>
                          <p className="text-[10px] text-[var(--text-tertiary)]">
                            {leads} leads from {convs} chats
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Lead Funnels */}
      {activeTab === "leads" && (
        <div className="space-y-6 animate-fade-in">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {leadKPIs.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="glass-card p-4 hover:transform-none flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--text-tertiary)] font-medium leading-none">
                      {card.label}
                    </span>
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: `color-mix(in srgb, var(--brand-${card.color}) 10%, transparent)`,
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color: `var(--brand-${card.color})` }} />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-[var(--text-primary)] mt-3 leading-none truncate">
                    {card.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Charts Section */}
          <LeadAnalyticsClient timelineData={timelineDataLeads} sourceData={sourceDataLeads} />

          {/* Recent Lead Captures Table */}
          <div className="glass-card p-5 hover:transform-none">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
              Recent Lead Logs
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-primary)] text-[var(--text-tertiary)]">
                    <th className="py-2.5 font-semibold">Lead Contact</th>
                    <th className="py-2.5 font-semibold">Workspace</th>
                    <th className="py-2.5 font-semibold">Chatbot Agent</th>
                    <th className="py-2.5 font-semibold text-center">Qualification Score</th>
                    <th className="py-2.5 font-semibold text-center">Status</th>
                    <th className="py-2.5 font-semibold text-right">Captured At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-primary)] text-[var(--text-secondary)]">
                  {recentLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-[var(--text-muted)]">
                        No leads captured on the platform yet.
                      </td>
                    </tr>
                  ) : (
                    recentLeads.map((l) => (
                      <tr key={l.id} className="hover:text-white">
                        <td className="py-3">
                          <div>
                            <p className="font-semibold text-xs text-text-primary">{l.name || "Anonymous"}</p>
                            <p className="text-[11px] text-[var(--text-muted)]">{l.email || l.phone || "No contact info"}</p>
                          </div>
                        </td>
                        <td className="py-3 text-xs">{l.tenant?.name || "Deleted Tenant"}</td>
                        <td className="py-3 text-xs">{l.chatbot?.name || "Deleted Chatbot"}</td>
                        <td className="py-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                l.score >= 75
                                  ? "bg-emerald-500"
                                  : l.score >= 50
                                  ? "bg-blue-500"
                                  : "bg-amber-500"
                              }`}
                            />
                            <span className="font-bold text-xs">{l.score}/100</span>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`badge text-[9px] py-0 px-2 uppercase font-bold ${
                              l.status === "QUALIFIED"
                                ? "badge-emerald"
                                : l.status === "NEW"
                                ? "badge-blue"
                                : l.status === "WON"
                                ? "badge-purple"
                                : "badge-pink"
                            }`}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td className="py-3 text-right text-xs">
                          {new Date(l.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
