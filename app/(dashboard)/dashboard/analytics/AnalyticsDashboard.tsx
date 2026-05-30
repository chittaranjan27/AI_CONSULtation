"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Users,
  TrendingUp,
  DollarSign,
  Search,
  Calendar,
  Star,
  Info,
  ShoppingBag,
  Bot,
  ChevronRight,
  Layers,
  Clock,
  Code2,
  Coins,
  Cpu,
  Zap,
  Mic,
  Activity,
  BarChart3,
  Globe as GlobeIcon,
  Download,
} from "lucide-react";
import { getPlanConfig } from "@/lib/billing/limits";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";

interface Message {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  metadata: unknown;
  createdAt: string;
}

interface AnalyticsProduct {
  id: string;
  name: string;
  price: number;
  category?: string;
  checkoutUrl?: string;
}

interface Visitor {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  metadata: unknown;
}

interface Chatbot {
  id: string;
  name: string;
  consultationSteps?: unknown;
}

interface Conversation {
  id: string;
  chatbotId: string;
  status: string;
  rating: number | null;
  feedback: string | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
  startedAt: string;
  endedAt: string | null;
  visitor: Visitor | null;
  chatbot: Chatbot | null;
  messages: Message[];
  usageRecords?: {
    requestType: string;
    cost: number;
    audioDuration?: number;
    characterCount?: number;
  }[];
}

interface TokenStats {
  tenantPlan: string;
  monthlyUsage: {
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
  chatUsage?: {
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
  voiceUsage?: {
    sttRequests: number;
    sttDuration: number;
    ttsRequests: number;
    ttsCharacters: number;
    cost: number;
    totalRequests: number;
  };
  usageByChatbot: {
    chatbotId: string;
    chatbotName: string;
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    chatCost: number;
    sttRequests: number;
    sttDuration: number;
    ttsRequests: number;
    ttsCharacters: number;
    voiceCost: number;
  }[];
  dailyTrends: {
    date: string;
    label: string;
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    chatCost: number;
    sttRequests: number;
    sttDuration: number;
    ttsRequests: number;
    ttsCharacters: number;
    voiceCost: number;
  }[];
  usageByModel: {
    modelId: string;
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }[];
}

interface FunnelStep {
  stepNumber: number;
  title: string;
  count: number;
}

interface LanguageItem {
  language: string;
  count: number;
}

interface AnalyticsDashboardProps {
  conversations: Conversation[];
  chatbots: Chatbot[];
  tokenStats?: TokenStats;
  funnelData?: FunnelStep[];
  languageDistribution?: LanguageItem[];
  engagementCounts?: Record<string, number>;
  dateRange?: { from: string; to: string };
}

const COLORS = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EC4899", "#06B6D4"];

export default function AnalyticsDashboard({
  conversations,
  chatbots,
  tokenStats,
  funnelData = [],
  languageDistribution = [],
  engagementCounts = {},
  dateRange,
}: AnalyticsDashboardProps) {
  const router = useRouter();

  const getConversationVoiceMetrics = useCallback((c: Conversation) => {
    const sttRecords = c.usageRecords?.filter((r) => r.requestType === "STT") || [];
    const ttsRecords = c.usageRecords?.filter((r) => r.requestType === "TTS") || [];

    const sttRequests = sttRecords.length;
    const sttDuration = sttRecords.reduce((sum, r) => sum + (r.audioDuration || 0), 0);
    const ttsRequests = ttsRecords.length;
    const ttsCharacters = ttsRecords.reduce((sum, r) => sum + (r.characterCount || 0), 0);
    const voiceCost = c.usageRecords?.reduce((sum, r) => sum + (r.cost || 0), 0) || 0;
    const llmCost = c.messages.reduce((sum, m) => sum + (Number(m.cost) || 0), 0);

    return {
      sttRequests,
      sttDuration,
      ttsRequests,
      ttsCharacters,
      voiceCost,
      llmCost,
      totalCost: llmCost + voiceCost,
    };
  }, []);

  const [mainView, setMainView] = useState<"audit" | "tokens">("audit");
  const [tokenSubView, setTokenSubView] = useState<"chat" | "voice" | "engagement">("chat");
  const [tokenTrendMetric, setTokenTrendMetric] = useState<"tokens" | "cost">("tokens");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(
    conversations[0]?.id || null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBotId, setSelectedBotId] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [activeView, setActiveView] = useState<"overview" | "timeline" | "transcript">("overview");
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // Scroll into view on mobile/tablet viewports when selectedChatId changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024 && selectedChatId) {
      const panel = document.getElementById("conversation-auditor-panel");
      if (panel) {
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [selectedChatId]);

  // CSV export utility
  const exportToCSV = useCallback((data: Record<string, unknown>[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Date range navigation helper
  const setDateRange = useCallback(
    (from: string, to: string) => {
      router.push(`/dashboard/analytics?from=${from}&to=${to}`);
    },
    [router]
  );

  // Safe fallback for tokenStats
  const statsData = useMemo(() => {
    const defaultStats: TokenStats = {
      tenantPlan: "FREE",
      monthlyUsage: { totalTokens: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
      usageByChatbot: [],
      dailyTrends: [],
      usageByModel: [],
    };
    return tokenStats || defaultStats;
  }, [tokenStats]);

  const planConfig = useMemo(() => {
    return getPlanConfig(statsData.tenantPlan as any);
  }, [statsData.tenantPlan]);

  const percentageUsed = useMemo(() => {
    if (!planConfig.tokenLimit) return 0;
    return Math.min(100, (statsData.monthlyUsage.totalTokens / planConfig.tokenLimit) * 100);
  }, [statsData.monthlyUsage.totalTokens, planConfig.tokenLimit]);

  const remainingTokens = useMemo(() => {
    return Math.max(0, planConfig.tokenLimit - statsData.monthlyUsage.totalTokens);
  }, [planConfig.tokenLimit, statsData.monthlyUsage.totalTokens]);

  const estimatedConversationsRemaining = useMemo(() => {
    const totalConvs = conversations.length;
    if (totalConvs === 0 || statsData.monthlyUsage.totalTokens === 0) {
      return Math.round(remainingTokens / 1500);
    }
    const avgTokensPerConvo = statsData.monthlyUsage.totalTokens / totalConvs;
    return Math.round(remainingTokens / (avgTokensPerConvo || 1));
  }, [remainingTokens, conversations.length, statsData.monthlyUsage.totalTokens]);

  const equivalentWordsUsed = useMemo(() => {
    return Math.round(statsData.monthlyUsage.totalTokens * 0.75);
  }, [statsData.monthlyUsage.totalTokens]);

  // --- Dynamic KPI Calculations ---
  const stats = useMemo(() => {
    const totalConvs = conversations.length;
    const totalMessages = conversations.reduce((sum, c) => sum + c.messages.length, 0);
    const leadsCaptured = conversations.filter(
      (c) => c.visitor?.email || c.visitor?.phone || c.visitor?.name
    ).length;

    // Recommendation count: conversations where any assistant message contains products
    const productRecommendations = conversations.filter((c) =>
      c.messages.some((m) => {
        if (!m.metadata) return false;
        try {
          const meta = typeof m.metadata === "string" ? JSON.parse(m.metadata) : m.metadata;
          return Array.isArray(meta?.products) && meta.products.length > 0;
        } catch {
          return false;
        }
      })
    ).length;

    const avgLength = totalConvs > 0 ? (totalMessages / totalConvs).toFixed(1) : 0;
    const totalCost = conversations.reduce(
      (sum, c) =>
        sum + c.messages.reduce((mSum, m) => mSum + (Number(m.cost) || 0), 0),
      0
    );

    const conversionRate = totalConvs > 0 ? ((leadsCaptured / totalConvs) * 100).toFixed(1) : 0;

    return {
      totalConvs,
      totalMessages,
      leadsCaptured,
      productRecommendations,
      avgLength,
      totalCost: totalCost.toFixed(3),
      conversionRate,
    };
  }, [conversations]);

  // --- Recharts: Conversations Over Time (Last 7 Days) ---
  const last7DaysData = useMemo(() => {
    const days = Array.from({ length: 7 })
      .map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split("T")[0];
      })
      .reverse();

    return days.map((day) => {
      const count = conversations.filter((c) => c.createdAt.startsWith(day)).length;
      const dateObj = new Date(day);
      const label = dateObj.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      return { label, count };
    });
  }, [conversations]);

  // --- Recharts: Step Funnel Conversion rate ---
  const auditFunnelData = useMemo(() => {
    // Determine step definitions dynamically from chatbot configuration
    let stepDefs: { step: number; label: string }[] = [];

    if (selectedBotId !== "all") {
      // Use steps from the selected chatbot
      const selectedBot = chatbots.find((b) => b.id === selectedBotId);
      if (selectedBot && Array.isArray(selectedBot.consultationSteps)) {
        stepDefs = (selectedBot.consultationSteps as { stepNumber: number; title: string }[])
          .sort((a, b) => a.stepNumber - b.stepNumber)
          .map((s) => ({ step: s.stepNumber, label: `${s.stepNumber}. ${s.title}` }));
      }
    }

    // Fallback: derive from all chatbots or use generic labels
    if (stepDefs.length === 0) {
      let maxSteps = 0;
      for (const bot of chatbots) {
        if (Array.isArray(bot.consultationSteps)) {
          maxSteps = Math.max(maxSteps, (bot.consultationSteps as unknown[]).length);
        }
      }
      if (maxSteps === 0) maxSteps = 6; // sensible default
      stepDefs = Array.from({ length: maxSteps }, (_, i) => ({
        step: i + 1,
        label: `Step ${i + 1}`,
      }));
    }

    return stepDefs.map((s) => {
      const count = conversations.filter((c) => {
        // Only count conversations for the selected chatbot if filtered
        if (selectedBotId !== "all" && c.chatbotId !== selectedBotId) return false;
        const meta = typeof c.metadata === "string" ? JSON.parse(c.metadata || "{}") : c.metadata;
        const currentStep = Number(meta?.currentStep || 0);

        if (currentStep >= s.step) return true;
        // Fallback: assume conversation reached the step based on message history density
        if (c.messages.length >= s.step * 2) return true;
        return false;
      }).length;

      return {
        name: s.label,
        Conversations: count,
      };
    });
  }, [conversations, chatbots, selectedBotId]);

  // --- Recharts: Conversations by Chatbot ---
  const chatbotDistribution = useMemo(() => {
    return chatbots.map((bot) => {
      const count = conversations.filter((c) => c.chatbotId === bot.id).length;
      return {
        name: bot.name,
        value: count,
      };
    });
  }, [conversations, chatbots]);

  // --- Recharts: Ratings Distribution ---
  const ratingsData = useMemo(() => {
    return [5, 4, 3, 2, 1].map((rating) => {
      const count = conversations.filter((c) => c.rating === rating).length;
      return {
        name: `${rating} Star`,
        count,
      };
    });
  }, [conversations]);

  const voiceConversations = useMemo(() => {
    return conversations
      .filter((c) => c.usageRecords && c.usageRecords.some((r) => r.requestType === "STT" || r.requestType === "TTS"))
      .map((c) => {
        const metrics = getConversationVoiceMetrics(c);
        const visitorName = c.visitor?.name || c.visitor?.email || "Anonymous Visitor";
        return {
          id: c.id,
          visitorName,
          chatbotName: c.chatbot?.name || "Unknown Bot",
          createdAt: c.createdAt,
          ...metrics,
        };
      })
      .sort((a, b) => b.voiceCost - a.voiceCost);
  }, [conversations, getConversationVoiceMetrics]);

  // --- Conversations Search & Filters ---
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const matchBot = selectedBotId === "all" || c.chatbotId === selectedBotId;
      const matchStatus = selectedStatus === "all" || c.status === selectedStatus;

      const search = searchTerm.toLowerCase();
      const visitorName = (
        c.visitor?.name ||
        c.visitor?.email?.split("@")[0] ||
        "Anonymous"
      ).toLowerCase();
      const visitorEmail = (c.visitor?.email || "").toLowerCase();
      const visitorPhone = (c.visitor?.phone || "").toLowerCase();
      const matchSearch =
        !searchTerm ||
        visitorName.includes(search) ||
        visitorEmail.includes(search) ||
        visitorPhone.includes(search) ||
        c.messages.some((m) => m.content.toLowerCase().includes(search));

      return matchBot && matchStatus && matchSearch;
    });
  }, [conversations, selectedBotId, selectedStatus, searchTerm]);

  // --- Selected Conversation Details ---
  const selectedConversation = useMemo(() => {
    if (!selectedChatId) return null;
    return conversations.find((c) => c.id === selectedChatId) || null;
  }, [conversations, selectedChatId]);

  const getConversationDuration = (c: Conversation) => {
    const start = new Date(c.startedAt || c.createdAt).getTime();
    const end = c.endedAt
      ? new Date(c.endedAt).getTime()
      : new Date(c.updatedAt).getTime();
    const diffSeconds = Math.floor((end - start) / 1000);

    if (diffSeconds < 60) return `${diffSeconds}s`;
    const minutes = Math.floor(diffSeconds / 60);
    const seconds = diffSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  const getMessageProducts = (msg: Message) => {
    if (!msg.metadata) return null;
    try {
      const meta = typeof msg.metadata === "string" ? JSON.parse(msg.metadata) : msg.metadata;
      return Array.isArray(meta?.products) ? meta.products : null;
    } catch {
      return null;
    }
  };

  const getMessageSuggestions = (msg: Message) => {
    if (!msg.metadata) return null;
    try {
      const meta = typeof msg.metadata === "string" ? JSON.parse(msg.metadata) : msg.metadata;
      return Array.isArray(meta?.suggestions) ? meta.suggestions : null;
    } catch {
      return null;
    }
  };

  if (!isMounted) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <div className="h-8 w-64 bg-[var(--bg-tertiary)] skeleton animate-pulse mb-2" />
          <div className="h-4 w-96 bg-[var(--bg-tertiary)] skeleton animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-4 h-24 skeleton animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card p-5 h-72 lg:col-span-2 skeleton animate-pulse" />
          <div className="glass-card p-5 h-72 skeleton animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Analytics & Audit</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Perform drill-down audits of conversations, analyze step-by-step intake progress, and inspect live user interactions.
          </p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          {
            label: "Today",
            getRange: () => {
              const today = new Date().toISOString().split("T")[0];
              return { from: today, to: today };
            },
          },
          {
            label: "Last 7 Days",
            getRange: () => {
              const to = new Date();
              const from = new Date();
              from.setDate(from.getDate() - 7);
              return { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] };
            },
          },
          {
            label: "Last 30 Days",
            getRange: () => {
              const to = new Date();
              const from = new Date();
              from.setDate(from.getDate() - 30);
              return { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] };
            },
          },
          {
            label: "This Month",
            getRange: () => {
              const now = new Date();
              const from = new Date(now.getFullYear(), now.getMonth(), 1);
              return { from: from.toISOString().split("T")[0], to: now.toISOString().split("T")[0] };
            },
          },
          {
            label: "Last Month",
            getRange: () => {
              const now = new Date();
              const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              const to = new Date(now.getFullYear(), now.getMonth(), 0);
              return { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] };
            },
          },
        ].map((preset) => {
          const range = preset.getRange();
          const isActive = dateRange?.from === range.from && dateRange?.to === range.to;
          return (
            <button
              key={preset.label}
              onClick={() => setDateRange(range.from, range.to)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-[var(--brand-purple)] text-white shadow-md"
                  : "bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border border-[var(--border-primary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {preset.label}
            </button>
          );
        })}

        {/* Custom date inputs */}
        <div className="flex items-center gap-1.5 ml-auto">
          <input
            type="date"
            value={dateRange?.from || ""}
            onChange={(e) => setDateRange(e.target.value, dateRange?.to || new Date().toISOString().split("T")[0])}
            className="px-2 py-1 rounded-lg text-[10px] bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] cursor-pointer"
          />
          <span className="text-[10px] text-[var(--text-muted)]">→</span>
          <input
            type="date"
            value={dateRange?.to || ""}
            onChange={(e) => setDateRange(dateRange?.from || new Date().toISOString().split("T")[0], e.target.value)}
            className="px-2 py-1 rounded-lg text-[10px] bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] cursor-pointer"
          />
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex border-b border-[var(--border-primary)] gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setMainView("audit")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 -mb-px cursor-pointer shrink-0 ${
            mainView === "audit"
              ? "border-[var(--brand-purple)] text-[var(--text-primary)] font-bold"
              : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          }`}
        >
          <Layers className="w-4 h-4" /> Intake & Conversation Audit
        </button>
        <button
          onClick={() => setMainView("tokens")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 -mb-px cursor-pointer shrink-0 ${
            mainView === "tokens"
              ? "border-[var(--brand-purple)] text-[var(--text-primary)] font-bold"
              : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          }`}
        >
          <Coins className="w-4 h-4 text-[var(--brand-amber)] animate-pulse" /> Token & Costs Analytics
        </button>
      </div>

      {mainView === "tokens" ? (
        <div className="space-y-6 animate-fade-in-up">
          {/* Chat / Voice Sub-Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] w-fit overflow-x-auto whitespace-nowrap scrollbar-none max-w-full">
            <button
              onClick={() => setTokenSubView("chat")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                tokenSubView === "chat"
                  ? "bg-[var(--brand-purple)] text-white shadow-md"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Chat (LLM) Usage
            </button>
            <button
              onClick={() => setTokenSubView("voice")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                tokenSubView === "voice"
                  ? "bg-[var(--brand-purple)] text-white shadow-md"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Mic className="w-3.5 h-3.5" /> Voice (STT & TTS) Usage
            </button>
            <button
              onClick={() => setTokenSubView("engagement")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                tokenSubView === "engagement"
                  ? "bg-[var(--brand-purple)] text-white shadow-md"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> Engagement
            </button>
          </div>

          {tokenSubView === "chat" ? (
            <div className="space-y-6 animate-fade-in-up">
              {/* Top row: Hero limits card + KPI metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Hero limits card */}
                <div className="glass-card p-6 lg:col-span-1 flex flex-col justify-between relative overflow-hidden group hover:transform-none">
                  <div className="absolute top-[-10%] right-[-10%] w-[150px] h-[150px] bg-purple-500/10 rounded-full blur-[50px] pointer-events-none" />
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[var(--brand-purple)]/15 text-[var(--brand-purple)] border border-[var(--brand-purple)]/30 uppercase tracking-wide">
                        {planConfig.name}
                      </span>
                      <Coins className="w-5 h-5 text-[var(--brand-amber)]" />
                    </div>
                    <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Monthly Token Consumption</h3>
                    <p className="text-3xl font-extrabold text-[var(--text-primary)] mt-1.5 font-mono">
                      {statsData.monthlyUsage.totalTokens.toLocaleString()}{" "}
                      <span className="text-xs font-medium text-[var(--text-tertiary)] font-sans">
                        / {planConfig.tokenLimit.toLocaleString()}
                      </span>
                    </p>
                    
                    {/* Progress bar */}
                    <div className="mt-4">
                      <div className="h-2 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden border border-[var(--border-primary)]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            percentageUsed > 90
                              ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                              : percentageUsed > 75
                              ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                              : "bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-blue)]"
                          }`}
                          style={{ width: `${percentageUsed}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)] mt-1.5 font-medium">
                        <span>{percentageUsed.toFixed(1)}% Used</span>
                        <span>{remainingTokens.toLocaleString()} tokens remaining</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-[var(--border-primary)]/50 space-y-2 text-xs">
                    <div className="flex items-start gap-2 text-[var(--text-secondary)]">
                      <Zap className="w-3.5 h-3.5 mt-0.5 text-[var(--brand-cyan)] shrink-0" />
                      <span>
                        Equivalent to ~<strong>{equivalentWordsUsed.toLocaleString()}</strong> words written by AI.
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-[var(--text-secondary)]">
                      <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-[var(--brand-purple)] shrink-0" />
                      <span>
                        Supports approx. <strong>{estimatedConversationsRemaining.toLocaleString()}</strong> additional chats this month.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Chat KPI grid */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      label: "MTD Chat Cost",
                      value: `$${(statsData.chatUsage?.cost ?? statsData.monthlyUsage.cost).toFixed(3)}`,
                      desc: "Estimated raw LLM API consumption cost",
                      icon: DollarSign,
                      color: "emerald",
                    },
                    {
                      label: "Avg. Cost Per Conversation",
                      value: `$${(conversations.length > 0 ? (statsData.chatUsage?.cost ?? statsData.monthlyUsage.cost) / conversations.length : 0).toFixed(4)}`,
                      desc: "Raw model API cost per chat session",
                      icon: TrendingUp,
                      color: "purple",
                    },
                    {
                      label: "Input / Output Balance",
                      value: `${Math.round(((statsData.chatUsage?.inputTokens ?? statsData.monthlyUsage.inputTokens) / (statsData.monthlyUsage.totalTokens || 1)) * 100)}% / ${Math.round(((statsData.chatUsage?.outputTokens ?? statsData.monthlyUsage.outputTokens) / (statsData.monthlyUsage.totalTokens || 1)) * 100)}%`,
                      desc: `Input: ${(statsData.chatUsage?.inputTokens ?? statsData.monthlyUsage.inputTokens).toLocaleString()} | Output: ${(statsData.chatUsage?.outputTokens ?? statsData.monthlyUsage.outputTokens).toLocaleString()}`,
                      icon: Layers,
                      color: "blue",
                    },
                    {
                      label: "Average Chat Size",
                      value: `${conversations.length > 0 ? Math.round((statsData.chatUsage?.totalTokens ?? statsData.monthlyUsage.totalTokens) / conversations.length).toLocaleString() : 0} tokens`,
                      desc: "Average tokens consumed per session",
                      icon: Code2,
                      color: "cyan",
                    },
                  ].map((kpi) => {
                    const Icon = kpi.icon;
                    return (
                      <div key={kpi.label} className="glass-card p-5 flex flex-col justify-between hover:transform-none">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs text-[var(--text-tertiary)] block font-semibold">{kpi.label}</span>
                            <span className="text-2xl font-bold text-[var(--text-primary)] block mt-1 font-mono">{kpi.value}</span>
                          </div>
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              background: `color-mix(in srgb, var(--brand-${kpi.color}) 12%, transparent)`,
                            }}
                          >
                            <Icon className="w-5 h-5" style={{ color: `var(--brand-${kpi.color})` }} />
                          </div>
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] mt-2 block leading-relaxed">{kpi.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chat Trend Chart */}
              <div className="glass-card p-5 hover:transform-none">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Chat Consumption & Cost Trends</h3>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Daily breakdown of LLM token usage over the billing cycle</p>
                  </div>
                  
                  {/* Metric Toggle */}
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] self-start">
                    <button
                      onClick={() => setTokenTrendMetric("tokens")}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        tokenTrendMetric === "tokens"
                          ? "bg-[var(--brand-purple)] text-white shadow-sm"
                          : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      Tokens Count
                    </button>
                    <button
                      onClick={() => setTokenTrendMetric("cost")}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        tokenTrendMetric === "cost"
                          ? "bg-[var(--brand-purple)] text-white shadow-sm"
                          : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      Estimated Cost
                    </button>
                  </div>
                </div>

                <div className="h-72 w-full">
                  {statsData.dailyTrends.length === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                      <Info className="w-8 h-8 text-[var(--text-muted)] mb-2" />
                      <p className="text-xs text-[var(--text-secondary)]">No chat consumption data recorded this month.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={288} minWidth={0}>
                      {tokenTrendMetric === "tokens" ? (
                        <BarChart data={statsData.dailyTrends} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" opacity={0.2} />
                          <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                          <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                          <Tooltip
                            contentStyle={{
                              background: "var(--bg-tertiary)",
                              borderColor: "var(--border-primary)",
                              borderRadius: "8px",
                              color: "var(--text-primary)",
                              fontSize: "12px",
                            }}
                          />
                          <Bar dataKey="inputTokens" name="Input Tokens" fill="var(--brand-blue)" stackId="a" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="outputTokens" name="Output Tokens" fill="var(--brand-purple)" stackId="a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      ) : (
                        <LineChart data={statsData.dailyTrends} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" opacity={0.2} />
                          <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                          <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} tickFormatter={(val) => `$${val.toFixed(2)}`} />
                          <Tooltip
                            contentStyle={{
                              background: "var(--bg-tertiary)",
                              borderColor: "var(--border-primary)",
                              borderRadius: "8px",
                              color: "var(--text-primary)",
                              fontSize: "12px",
                            }}
                            formatter={(val: any) => [`$${Number(val).toFixed(4)}`, "Chat Cost"]}
                          />
                          <Line
                            type="monotone"
                            dataKey="chatCost"
                            stroke="var(--brand-emerald)"
                            strokeWidth={2.5}
                            activeDot={{ r: 6 }}
                            name="Chat Cost"
                          />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chatbot Breakdown + Model breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chatbot breakdown */}
                <div className="glass-card p-5 hover:transform-none flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Chatbot Token Consumption</h3>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5 mb-4">LLM resource distribution across chatbots</p>
                  </div>
                  <div className="space-y-4">
                    {statsData.usageByChatbot.length === 0 ? (
                      <div className="text-center py-8 text-xs text-[var(--text-tertiary)]">No chatbot usage data available.</div>
                    ) : (
                      statsData.usageByChatbot.map((item, idx) => {
                        const botShare = statsData.monthlyUsage.totalTokens > 0
                          ? (item.totalTokens / statsData.monthlyUsage.totalTokens) * 100
                          : 0;
                        return (
                          <div key={item.chatbotId} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-medium">
                              <span className="text-[var(--text-primary)]">{item.chatbotName}</span>
                              <span className="text-[var(--text-secondary)] font-mono">
                                {item.totalTokens.toLocaleString()} tokens{" "}
                                <span className="text-[var(--text-muted)] font-sans">({botShare.toFixed(1)}%)</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-2 flex-grow bg-[var(--bg-secondary)] rounded-full overflow-hidden border border-[var(--border-primary)]">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${botShare}%`,
                                    backgroundColor: COLORS[idx % COLORS.length],
                                  }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-[var(--brand-emerald)] shrink-0 w-12 text-right font-mono">
                                ${item.chatCost.toFixed(3)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Model Breakdown */}
                <div className="glass-card p-5 hover:transform-none flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">AI Models Breakdown</h3>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5 mb-4">Volume and cost breakdown by LLM model</p>
                  </div>
                  <div className="space-y-4">
                    {statsData.usageByModel.length === 0 ? (
                      <div className="text-center py-8 text-xs text-[var(--text-tertiary)]">No model usage data available.</div>
                    ) : (
                      statsData.usageByModel.map((item, idx) => {
                        const modelShare = statsData.monthlyUsage.totalTokens > 0
                          ? (item.totalTokens / statsData.monthlyUsage.totalTokens) * 100
                          : 0;
                        return (
                          <div key={item.modelId} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-medium">
                              <span className="text-[var(--text-primary)] flex items-center gap-1.5 font-mono text-[11px]">
                                <Cpu className="w-3.5 h-3.5 text-[var(--brand-purple)]" />
                                {item.modelId}
                              </span>
                              <span className="text-[var(--text-secondary)] font-mono">
                                {item.totalTokens.toLocaleString()} tokens{" "}
                                <span className="text-[var(--text-muted)] font-sans">({modelShare.toFixed(1)}%)</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-2 flex-grow bg-[var(--bg-secondary)] rounded-full overflow-hidden border border-[var(--border-primary)]">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${modelShare}%`,
                                    backgroundColor: COLORS[(idx + 3) % COLORS.length],
                                  }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-[var(--brand-emerald)] shrink-0 w-12 text-right font-mono">
                                ${item.cost.toFixed(3)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Session Token footprint */}
              <div className="glass-card p-5 hover:transform-none">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Conversations Token Footprint</h3>
                    <p className="text-xs text-[var(--text-tertiary)] mb-4">Detailed session consumption logs (sorted by most tokens consumed)</p>
                  </div>
                  <button
                    onClick={() => {
                      const data = conversations.map((conv) => {
                        const total = conv.messages.reduce((sum, m) => sum + m.totalTokens, 0);
                        const input = conv.messages.reduce((sum, m) => sum + m.inputTokens, 0);
                        const output = conv.messages.reduce((sum, m) => sum + m.outputTokens, 0);
                        const cost = conv.messages.reduce((sum, m) => sum + m.cost, 0);
                        return {
                          Visitor: conv.visitor?.name || conv.visitor?.email?.split("@")[0] || "Anonymous",
                          Chatbot: conv.chatbot?.name || "Unknown",
                          Messages: conv.messages.length,
                          TotalTokens: total,
                          InputTokens: input,
                          OutputTokens: output,
                          EstimatedCost: cost.toFixed(4),
                        };
                      });
                      exportToCSV(data, "token_footprint");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all cursor-pointer shrink-0"
                  >
                    <Download className="w-3 h-3" /> Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-primary)] text-[var(--text-tertiary)]">
                        <th className="py-2.5 px-3">Visitor Name</th>
                        <th className="py-2.5 px-3">Chatbot</th>
                        <th className="py-2.5 px-3">Messages</th>
                        <th className="py-2.5 px-3 text-right">Total Tokens</th>
                        <th className="py-2.5 px-3 text-right">Input / Output</th>
                        <th className="py-2.5 px-3 text-right">Estimated Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-primary)]/50">
                      {conversations.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-xs text-[var(--text-tertiary)]">
                            No conversations captured yet.
                          </td>
                        </tr>
                      ) : (
                        [...conversations]
                          .map((conv) => {
                            const total = conv.messages.reduce((sum, m) => sum + m.totalTokens, 0);
                            const input = conv.messages.reduce((sum, m) => sum + m.inputTokens, 0);
                            const output = conv.messages.reduce((sum, m) => sum + m.outputTokens, 0);
                            const cost = conv.messages.reduce((sum, m) => sum + m.cost, 0);
                            return { conv, total, input, output, cost };
                          })
                          .sort((a, b) => b.total - a.total)
                          .map(({ conv, total, input, output, cost }) => {
                            const visitorName = conv.visitor?.name || conv.visitor?.email?.split("@")[0] || "Anonymous";
                            return (
                              <tr key={conv.id} className="hover:bg-[var(--bg-glass-hover)] transition-colors">
                                <td className="py-3 px-3 font-semibold text-[var(--text-primary)]">{visitorName}</td>
                                <td className="py-3 px-3">
                                  <span className="badge badge-purple text-[10px]">{conv.chatbot?.name}</span>
                                </td>
                                <td className="py-3 px-3 text-[var(--text-secondary)]">{conv.messages.length} messages</td>
                                <td className="py-3 px-3 text-right font-mono font-bold text-[var(--text-primary)]">{total.toLocaleString()}</td>
                                <td className="py-3 px-3 text-right font-mono text-[var(--text-tertiary)]">{input.toLocaleString()} / {output.toLocaleString()}</td>
                                <td className="py-3 px-3 text-right font-mono text-[var(--brand-emerald)] font-bold">${cost.toFixed(4)}</td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : tokenSubView === "engagement" ? (
            /* ═══════════ ENGAGEMENT VIEW ═══════════ */
            <div className="space-y-6 animate-fade-in-up">
              {/* Engagement KPI cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  {
                    label: "Widget Opens",
                    value: engagementCounts["widget_open"] || 0,
                    icon: Layers,
                    color: "purple",
                  },
                  {
                    label: "Chat Starts",
                    value: engagementCounts["chat_start"] || 0,
                    icon: MessageSquare,
                    color: "blue",
                  },
                  {
                    label: "Voice Sessions",
                    value: engagementCounts["voice_start"] || 0,
                    icon: Mic,
                    color: "cyan",
                  },
                  {
                    label: "Product Clicks",
                    value: engagementCounts["product_click"] || 0,
                    icon: ShoppingBag,
                    color: "amber",
                  },
                  {
                    label: "Language Changes",
                    value: engagementCounts["language_change"] || 0,
                    icon: GlobeIcon,
                    color: "emerald",
                  },
                ].map((kpi) => {
                  const Icon = kpi.icon;
                  return (
                    <div key={kpi.label} className="glass-card p-5 flex flex-col justify-between hover:transform-none">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs text-[var(--text-tertiary)] block font-semibold">{kpi.label}</span>
                          <span className="text-2xl font-bold text-[var(--text-primary)] block mt-1 font-mono">{kpi.value.toLocaleString()}</span>
                        </div>
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            background: `color-mix(in srgb, var(--brand-${kpi.color}) 12%, transparent)`,
                          }}
                        >
                          <Icon className="w-5 h-5" style={{ color: `var(--brand-${kpi.color})` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Consultation Funnel */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-5 hover:transform-none">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Consultation Step Funnel</h3>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5 mb-4">User drop-off at each intake step</p>
                  </div>
                  <div className="h-72 w-full">
                    {funnelData.length === 0 ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                        <BarChart3 className="w-8 h-8 text-[var(--text-muted)] mb-2" />
                        <p className="text-xs text-[var(--text-secondary)]">No consultation steps configured.</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={288} minWidth={0}>
                        <BarChart
                          data={funnelData.map((s) => ({
                            name: `${s.stepNumber}. ${s.title}`,
                            Users: s.count,
                          }))}
                          layout="vertical"
                          margin={{ left: 10, right: 20, top: 10, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" opacity={0.2} />
                          <XAxis type="number" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                          <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} width={120} />
                          <Tooltip
                            contentStyle={{
                              background: "var(--bg-tertiary)",
                              borderColor: "var(--border-primary)",
                              borderRadius: "8px",
                              color: "var(--text-primary)",
                              fontSize: "12px",
                            }}
                          />
                          <Bar dataKey="Users" radius={[0, 6, 6, 0]}>
                            {funnelData.map((_, idx) => (
                              <Cell key={`funnel-${idx}`} fill={COLORS[idx % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  {/* Drop-off percentages */}
                  {funnelData.length > 1 && (
                    <div className="mt-3 space-y-1">
                      {funnelData.slice(1).map((step, idx) => {
                        const prev = funnelData[idx].count;
                        const dropOff = prev > 0 ? (((prev - step.count) / prev) * 100).toFixed(1) : "0.0";
                        return (
                          <div key={step.stepNumber} className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
                            <ChevronRight className="w-3 h-3" />
                            <span>Step {funnelData[idx].stepNumber} → {step.stepNumber}: <strong className="text-[var(--text-secondary)]">{dropOff}% drop-off</strong></span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Language Distribution Pie Chart */}
                <div className="glass-card p-5 hover:transform-none flex flex-col">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Language Distribution</h3>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5 mb-4">Conversation language breakdown</p>
                  </div>
                  <div className="h-52 w-full flex items-center justify-center">
                    {languageDistribution.length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)]">No language data</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={208} minWidth={0}>
                        <PieChart>
                          <Pie
                            data={languageDistribution.map((l) => ({
                              name: l.language.toUpperCase(),
                              value: l.count,
                            }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {languageDistribution.map((_, idx) => (
                              <Cell key={`lang-${idx}`} fill={COLORS[idx % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: "var(--bg-tertiary)",
                              borderColor: "var(--border-primary)",
                              borderRadius: "8px",
                              fontSize: "11px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  {/* Legend */}
                  <div className="space-y-1 mt-3">
                    {languageDistribution.map((item, idx) => {
                      const total = languageDistribution.reduce((sum, l) => sum + l.count, 0);
                      const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : "0.0";
                      return (
                        <div key={item.language} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            />
                            <span className="text-[var(--text-secondary)]">{item.language.toUpperCase()}</span>
                          </div>
                          <span className="font-bold text-[var(--text-primary)]">
                            {item.count} ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Conversion Funnel Metrics */}
              <div className="glass-card p-5 hover:transform-none">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Conversion Funnel Metrics</h3>
                <p className="text-xs text-[var(--text-tertiary)] mb-4">End-to-end conversion analysis from widget open to product click</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(() => {
                    const widgetOpens = engagementCounts["widget_open"] || 0;
                    const chatStarts = engagementCounts["chat_start"] || 0;
                    const productClicks = engagementCounts["product_click"] || 0;
                    const voiceSessions = engagementCounts["voice_start"] || 0;
                    return [
                      {
                        label: "Widget → Chat Rate",
                        value: widgetOpens > 0 ? `${((chatStarts / widgetOpens) * 100).toFixed(1)}%` : "—",
                        desc: `${chatStarts} chats / ${widgetOpens} opens`,
                      },
                      {
                        label: "Chat → Voice Rate",
                        value: chatStarts > 0 ? `${((voiceSessions / chatStarts) * 100).toFixed(1)}%` : "—",
                        desc: `${voiceSessions} voice / ${chatStarts} chats`,
                      },
                      {
                        label: "Chat → Product Rate",
                        value: chatStarts > 0 ? `${((productClicks / chatStarts) * 100).toFixed(1)}%` : "—",
                        desc: `${productClicks} clicks / ${chatStarts} chats`,
                      },
                      {
                        label: "Widget → Product Rate",
                        value: widgetOpens > 0 ? `${((productClicks / widgetOpens) * 100).toFixed(1)}%` : "—",
                        desc: `${productClicks} clicks / ${widgetOpens} opens`,
                      },
                    ].map((metric) => (
                      <div key={metric.label} className="text-center p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                        <span className="text-xl font-extrabold text-[var(--text-primary)] font-mono block">{metric.value}</span>
                        <span className="text-[10px] font-semibold text-[var(--text-secondary)] block mt-1">{metric.label}</span>
                        <span className="text-[9px] text-[var(--text-muted)] block mt-0.5">{metric.desc}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          ) : (
            /* ═══════════ VOICE (STT & TTS) USAGE VIEW ═══════════ */
            <div className="space-y-6 animate-fade-in-up">
              {/* Voice KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "MTD Voice Cost",
                    value: `$${(statsData.voiceUsage?.cost ?? 0).toFixed(3)}`,
                    desc: "STT + TTS API charges combined",
                    icon: DollarSign,
                    color: "emerald",
                  },
                  {
                    label: "Audio Duration Processed",
                    value: `${Math.round(statsData.voiceUsage?.sttDuration ?? 0).toLocaleString()}s`,
                    desc: `${(statsData.voiceUsage?.sttRequests ?? 0).toLocaleString()} speech recognition requests`,
                    icon: Mic,
                    color: "blue",
                  },
                  {
                    label: "Synthesized Characters",
                    value: `${(statsData.voiceUsage?.ttsCharacters ?? 0).toLocaleString()}`,
                    desc: `${(statsData.voiceUsage?.ttsRequests ?? 0).toLocaleString()} text-to-speech requests`,
                    icon: Zap,
                    color: "purple",
                  },
                  {
                    label: "Total Voice Transactions",
                    value: `${(statsData.voiceUsage?.totalRequests ?? 0).toLocaleString()}`,
                    desc: "Combined STT + TTS triggers",
                    icon: Layers,
                    color: "cyan",
                  },
                ].map((kpi) => {
                  const Icon = kpi.icon;
                  return (
                    <div key={kpi.label} className="glass-card p-5 flex flex-col justify-between hover:transform-none">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs text-[var(--text-tertiary)] block font-semibold">{kpi.label}</span>
                          <span className="text-2xl font-bold text-[var(--text-primary)] block mt-1 font-mono">{kpi.value}</span>
                        </div>
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            background: `color-mix(in srgb, var(--brand-${kpi.color}) 12%, transparent)`,
                          }}
                        >
                          <Icon className="w-5 h-5" style={{ color: `var(--brand-${kpi.color})` }} />
                        </div>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] mt-2 block leading-relaxed">{kpi.desc}</span>
                    </div>
                  );
                })}
              </div>

              {/* Voice Trends Chart */}
              <div className="glass-card p-5 hover:transform-none">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Voice Usage & Cost Trends</h3>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5 mb-4">Daily breakdown of STT and TTS usage</p>
                </div>
                <div className="h-72 w-full">
                  {statsData.dailyTrends.length === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                      <Info className="w-8 h-8 text-[var(--text-muted)] mb-2" />
                      <p className="text-xs text-[var(--text-secondary)]">No voice usage data recorded this month.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={288} minWidth={0}>
                      <BarChart data={statsData.dailyTrends} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" opacity={0.2} />
                        <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                        <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            background: "var(--bg-tertiary)",
                            borderColor: "var(--border-primary)",
                            borderRadius: "8px",
                            color: "var(--text-primary)",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="sttRequests" name="STT Requests" fill="var(--brand-blue)" stackId="v" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="ttsRequests" name="TTS Requests" fill="var(--brand-purple)" stackId="v" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Voice Usage by Chatbot */}
              <div className="glass-card p-5 hover:transform-none">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Voice Usage by Chatbot</h3>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5 mb-4">STT and TTS distribution across chatbots</p>
                  </div>
                  <button
                    onClick={() => {
                      const data = statsData.usageByChatbot
                        .filter(b => b.sttRequests > 0 || b.ttsRequests > 0)
                        .map((item) => ({
                          Chatbot: item.chatbotName,
                          STTRequests: item.sttRequests,
                          AudioDuration: `${Math.round(item.sttDuration)}s`,
                          TTSRequests: item.ttsRequests,
                          Characters: item.ttsCharacters,
                          VoiceCost: item.voiceCost.toFixed(4),
                        }));
                      exportToCSV(data, "voice_usage_by_chatbot");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all cursor-pointer shrink-0"
                  >
                    <Download className="w-3 h-3" /> Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-primary)] text-[var(--text-tertiary)]">
                        <th className="py-2.5 px-3">Chatbot</th>
                        <th className="py-2.5 px-3 text-right">STT Requests</th>
                        <th className="py-2.5 px-3 text-right">Audio Duration</th>
                        <th className="py-2.5 px-3 text-right">TTS Requests</th>
                        <th className="py-2.5 px-3 text-right">Characters</th>
                        <th className="py-2.5 px-3 text-right">Voice Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-primary)]/50">
                      {statsData.usageByChatbot.filter(b => b.sttRequests > 0 || b.ttsRequests > 0).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-xs text-[var(--text-tertiary)]">
                            No voice usage data recorded yet.
                          </td>
                        </tr>
                      ) : (
                        statsData.usageByChatbot
                          .filter(b => b.sttRequests > 0 || b.ttsRequests > 0)
                          .sort((a, b) => b.voiceCost - a.voiceCost)
                          .map((item) => (
                            <tr key={item.chatbotId} className="hover:bg-[var(--bg-glass-hover)] transition-colors">
                              <td className="py-3 px-3 font-semibold text-[var(--text-primary)]">{item.chatbotName}</td>
                              <td className="py-3 px-3 text-right font-mono text-[var(--text-secondary)]">{item.sttRequests.toLocaleString()}</td>
                              <td className="py-3 px-3 text-right font-mono text-[var(--text-secondary)]">{Math.round(item.sttDuration).toLocaleString()}s</td>
                              <td className="py-3 px-3 text-right font-mono text-[var(--text-secondary)]">{item.ttsRequests.toLocaleString()}</td>
                              <td className="py-3 px-3 text-right font-mono text-[var(--text-secondary)]">{item.ttsCharacters.toLocaleString()}</td>
                              <td className="py-3 px-3 text-right font-mono text-[var(--brand-emerald)] font-bold">${item.voiceCost.toFixed(4)}</td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Voice Usage by Conversation */}
              <div className="glass-card p-5 hover:transform-none">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Voice Usage by Conversation</h3>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5 mb-4">Detailed breakdown of voice sessions, sorted by consumption cost</p>
                  </div>
                  <button
                    onClick={() => {
                      const data = voiceConversations.map((c) => ({
                        ConversationID: c.id,
                        Visitor: c.visitorName,
                        Chatbot: c.chatbotName,
                        Date: new Date(c.createdAt).toLocaleDateString(),
                        STTRequests: c.sttRequests,
                        AudioDuration: `${Math.round(c.sttDuration)}s`,
                        TTSRequests: c.ttsRequests,
                        Characters: c.ttsCharacters,
                        VoiceCost: c.voiceCost.toFixed(4),
                        TotalCost: c.totalCost.toFixed(4),
                      }));
                      exportToCSV(data, "voice_usage_by_conversation");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all cursor-pointer shrink-0"
                  >
                    <Download className="w-3 h-3" /> Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-primary)] text-[var(--text-tertiary)] font-bold">
                        <th className="py-2.5 px-3">Session & Visitor</th>
                        <th className="py-2.5 px-3 text-right">STT (Requests/Dur)</th>
                        <th className="py-2.5 px-3 text-right">TTS (Requests/Chars)</th>
                        <th className="py-2.5 px-3 text-right">Voice Cost</th>
                        <th className="py-2.5 px-3 text-right">Session Cost</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-primary)]/50">
                      {voiceConversations.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-xs text-[var(--text-tertiary)]">
                            No voice conversations recorded yet.
                          </td>
                        </tr>
                      ) : (
                        voiceConversations.map((item) => (
                          <tr key={item.id} className="hover:bg-[var(--bg-glass-hover)] transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-semibold text-[var(--text-primary)] truncate max-w-[180px]">{item.visitorName}</div>
                              <div className="text-[9px] text-[var(--text-muted)] mt-0.5 truncate max-w-[180px] font-mono">ID: {item.id} · {item.chatbotName}</div>
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-[var(--text-secondary)]">
                              {item.sttRequests} reqs / {Math.round(item.sttDuration)}s
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-[var(--text-secondary)]">
                              {item.ttsRequests} reqs / {item.ttsCharacters.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-[var(--text-secondary)] font-bold">${item.voiceCost.toFixed(4)}</td>
                            <td className="py-3 px-3 text-right font-mono text-[var(--brand-emerald)] font-bold">${item.totalCost.toFixed(4)}</td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => {
                                  setMainView("audit");
                                  setSelectedChatId(item.id);
                                  setActiveView("overview");
                                }}
                                className="px-2 py-1 rounded bg-[var(--brand-purple)]/10 border border-[var(--brand-purple)]/20 hover:bg-[var(--brand-purple)] hover:text-white transition-all text-[9px] font-bold text-[var(--brand-purple)] cursor-pointer"
                              >
                                Audit
                              </button>
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
      ) : (
        <>
          {/* KPI stats bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {[
          { label: "Conversations", value: stats.totalConvs, icon: MessageSquare, color: "purple" },
          { label: "Total Messages", value: stats.totalMessages, icon: Code2, color: "blue" },
          { label: "Leads Captured", value: stats.leadsCaptured, icon: Users, color: "emerald" },
          { label: "Conversion Rate", value: `${stats.conversionRate}%`, icon: TrendingUp, color: "pink" },
          { label: "Product Recs", value: stats.productRecommendations, icon: ShoppingBag, color: "cyan" },
          { label: "Tokens Cost MTD", value: `$${stats.totalCost}`, icon: DollarSign, color: "amber" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card p-4 hover:transform-none">
              <Icon className="w-5 h-5 mb-2" style={{ color: `var(--brand-${stat.color})` }} />
              <p className="text-xl font-bold text-[var(--text-primary)]">{stat.value}</p>
              <p className="text-xs text-[var(--text-tertiary)]">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recharts Grid (Only visible in Overview section) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations Chart */}
        <div className="glass-card p-5 hover:transform-none lg:col-span-2">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Conversations Volume (Last 7 Days)</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height={240} minWidth={0}>
              <LineChart data={last7DaysData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" opacity={0.2} />
                <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-tertiary)",
                    borderColor: "var(--border-primary)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--brand-purple)"
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                  name="Conversations"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chatbot Distribution Pie */}
        <div className="glass-card p-5 hover:transform-none flex flex-col justify-between">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Chatbot Shares</h3>
          <div className="h-44 w-full relative flex items-center justify-center">
            {conversations.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={176} minWidth={0}>
                <PieChart>
                  <Pie
                    data={chatbotDistribution.filter((c) => c.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chatbotDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-tertiary)",
                      borderColor: "var(--border-primary)",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="space-y-1 mt-2">
            {chatbotDistribution.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-[var(--text-secondary)] truncate max-w-[120px]">
                    {item.name}
                  </span>
                </div>
                <span className="font-bold text-[var(--text-primary)]">{item.value} chats</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step Funnel progress */}
        <div className="glass-card p-5 hover:transform-none lg:col-span-2">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
            Intake Steps Progression Funnel
          </h3>
          <p className="text-xs text-[var(--text-tertiary)] mb-4">
            Shows conversion and progression depth. Adapts dynamically to each chatbot&apos;s configured intake steps.
          </p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height={240} minWidth={0}>
              <BarChart data={auditFunnelData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" opacity={0.2} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-tertiary)",
                    borderColor: "var(--border-primary)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="Conversations" fill="var(--brand-purple)" radius={[4, 4, 0, 0]}>
                  {auditFunnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="var(--brand-purple)" opacity={1 - index * 0.12} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ratings Feedback Distribution */}
        <div className="glass-card p-5 hover:transform-none flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Customer Reviews</h3>
            <p className="text-[11px] text-[var(--text-tertiary)] mb-4">Ratings recorded during conversation exit states.</p>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height={176} minWidth={0}>
              <BarChart
                layout="vertical"
                data={ratingsData}
                margin={{ left: -10, right: 10, top: 0, bottom: 0 }}
              >
                <XAxis type="number" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-tertiary)",
                    borderColor: "var(--border-primary)",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                />
                <Bar dataKey="count" fill="var(--brand-amber)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] pt-2 border-t border-[var(--border-primary)]">
            <span>Rated Sessions: {conversations.filter((c) => c.rating).length}</span>
            <span>Avg Rating: {(conversations.filter(c => c.rating).reduce((sum, c) => sum + (c.rating || 0), 0) / (conversations.filter(c => c.rating).length || 1)).toFixed(1)} / 5</span>
          </div>
        </div>
      </div>

      {/* Conversation Inspector Split Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-[var(--border-primary)]">
        {/* Left Side: Conversations list search/filters */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Sessions Explorer</h3>
            <span className="badge badge-purple text-[10px]">
              {filteredConversations.length} Match{filteredConversations.length !== 1 && "es"}
            </span>
          </div>

          <div className="space-y-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] p-4 rounded-2xl">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search visitor, email, message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 transition-all placeholder:text-[var(--text-muted)]"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-[var(--text-secondary)]">Bot</label>
                <select
                  value={selectedBotId}
                  onChange={(e) => setSelectedBotId(e.target.value)}
                  className="w-full p-2 rounded-lg text-[10px] bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] outline-none"
                >
                  <option value="all">All Chatbots</option>
                  {chatbots.map((bot) => (
                    <option key={bot.id} value={bot.id}>
                      {bot.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-[var(--text-secondary)]">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full p-2 rounded-lg text-[10px] bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Conversations Scroll List */}
          <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12 glass-card hover:transform-none">
                <Info className="w-6 h-6 mx-auto mb-2 text-[var(--text-muted)]" />
                <p className="text-xs text-[var(--text-secondary)]">No conversations found</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Try resetting search query filters.</p>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const visitorName = c.visitor?.name || c.visitor?.email?.split("@")[0] || "Anonymous Visitor";
                const isSelected = c.id === selectedChatId;
                const latestMsg = c.messages[c.messages.length - 1]?.content || "No messages yet";

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedChatId(c.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? "bg-[var(--brand-purple)]/10 border-[var(--brand-purple)]/40 shadow-sm"
                        : "bg-[var(--bg-tertiary)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-xs font-bold text-[var(--brand-purple)] shrink-0">
                          {visitorName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                            {visitorName}
                          </p>
                          <p className="text-[9px] text-[var(--text-tertiary)] truncate">
                            {c.chatbot?.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[9px] text-[var(--text-muted)]">
                          {new Date(c.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span
                          className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                            c.status === "ACTIVE" ? "badge-emerald" : "badge-purple"
                          }`}
                        >
                          {c.status.toLowerCase()}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1 italic">
                      &ldquo;{latestMsg}&rdquo;
                    </p>

                    <div className="flex items-center justify-between text-[9px] text-[var(--text-muted)] pt-1.5 border-t border-[var(--border-primary)]/50">
                      <span>{c.messages.length} messages</span>
                      {c.rating && (
                        <span className="flex items-center gap-0.5 text-[var(--brand-amber)]">
                          <Star className="w-2.5 h-2.5 fill-current" /> {c.rating}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Conversation Auditor Panel */}
        <div id="conversation-auditor-panel" className="lg:col-span-2 flex flex-col h-full min-h-[600px] glass-card p-0 hover:transform-none">
          {!selectedConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <MessageSquare className="w-10 h-10 text-[var(--text-muted)] animate-pulse" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Select a session to audit
              </h3>
              <p className="text-xs text-[var(--text-tertiary)] max-w-sm">
                Click on any conversation from the list to view its transcript, intake flow progression, and visitor details.
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full divide-y divide-[var(--border-primary)]">
              {/* Auditor Panel Header */}
              <div className="p-4 bg-[var(--bg-tertiary)] rounded-t-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center shrink-0 border border-[var(--border-primary)]">
                      <Bot className="w-5 h-5 text-[var(--brand-purple)]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">
                        {selectedConversation.visitor?.name ||
                          selectedConversation.visitor?.email ||
                          "Anonymous Visitor"}
                      </h4>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                        Chatbot: <strong>{selectedConversation.chatbot?.name}</strong> · Session ID:{" "}
                        <span className="font-mono text-[10px]">{selectedConversation.id}</span>
                      </p>
                    </div>
                  </div>

                  {/* Toggle Sub-View Header buttons */}
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] self-start sm:self-center shrink-0">
                    {[
                      { id: "overview", label: "Overview" },
                      { id: "timeline", label: "Flow Timeline" },
                      { id: "transcript", label: "Transcript" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveView(tab.id as "overview" | "timeline" | "transcript")}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                          activeView === tab.id
                            ? "bg-[var(--brand-purple)] text-white shadow-sm"
                            : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subheader Visitor Metadatas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[10px] border-t border-[var(--border-primary)]/50 text-[var(--text-secondary)]">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[var(--text-muted)]" />
                    <span>
                      {new Date(selectedConversation.createdAt).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                    <span>Duration: {getConversationDuration(selectedConversation)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-[var(--text-muted)]" />
                    <span>
                      Cost: $
                      {getConversationVoiceMetrics(selectedConversation).totalCost.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-[var(--text-muted)]" />
                    <span>
                      Active Step: Step{" "}
                      {(() => {
                        const metadata = selectedConversation.metadata;
                        const meta = (typeof metadata === "string"
                          ? JSON.parse(metadata || "{}")
                          : metadata) as Record<string, unknown> | null;
                        return String(meta?.currentStep || 1);
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Auditor Sub-View: Overview */}
              {activeView === "overview" && (
                <div className="flex-1 p-5 space-y-6 overflow-y-auto max-h-[460px]">
                  {/* Lead CRM data */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-[var(--text-primary)]">Lead Contact Info</h5>
                    <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-[var(--text-tertiary)] block">Name</span>
                        <span className="text-[var(--text-secondary)]">
                          {selectedConversation.visitor?.name || "Not captured"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-tertiary)] block">Email</span>
                        <span className="text-[var(--text-secondary)]">
                          {selectedConversation.visitor?.email || "Not captured"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-tertiary)] block">Phone</span>
                        <span className="text-[var(--text-secondary)]">
                          {selectedConversation.visitor?.phone || "Not captured"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Browser Metadata */}
                  {!!selectedConversation.visitor?.metadata && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-[var(--text-primary)]">System & Session Metadata</h5>
                      <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {(() => {
                          const meta = (
                            typeof selectedConversation.visitor.metadata === "string"
                              ? JSON.parse(selectedConversation.visitor.metadata)
                              : selectedConversation.visitor.metadata
                          ) as Record<string, unknown>;
                          return (
                            <>
                              <div>
                                <span className="text-[10px] text-[var(--text-tertiary)] block">Referrer URL</span>
                                <span className="text-[var(--text-secondary)] truncate block" title={String(meta?.referrer || "")}>
                                  {String(meta?.referrer || "Direct Visit")}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-[var(--text-tertiary)] block">User Agent</span>
                                <span className="text-[var(--text-secondary)] truncate block" title={String(meta?.userAgent || "")}>
                                  {String(meta?.userAgent || "Unknown")}
                                </span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Reviews Summary */}
                  {(selectedConversation.rating || selectedConversation.feedback) && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-[var(--text-primary)]">Exit Survey Feedback</h5>
                      <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] space-y-2 text-xs">
                        {selectedConversation.rating && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-[var(--text-tertiary)]">Score:</span>
                            <div className="flex items-center gap-0.5 text-[var(--brand-amber)]">
                              {Array.from({ length: selectedConversation.rating }).map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-current" />
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedConversation.feedback && (
                          <div>
                            <span className="text-[10px] text-[var(--text-tertiary)] block">User Comments:</span>
                            <p className="text-[var(--text-secondary)] italic leading-relaxed">
                              &ldquo;{selectedConversation.feedback}&rdquo;
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI Model diagnostics */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-[var(--text-primary)]">AI Model Usage Details</h5>
                    <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] space-y-2.5 text-xs text-[var(--text-secondary)]">
                      <div className="flex justify-between items-center text-[10px] text-[var(--text-tertiary)]">
                        <span>Total Tokens</span>
                        <span>Input / Output Tokens</span>
                      </div>
                      <div className="flex justify-between items-center font-semibold">
                        <span>
                          {selectedConversation.messages.reduce((sum, m) => sum + m.totalTokens, 0).toLocaleString()}
                        </span>
                        <span>
                          {selectedConversation.messages.reduce((sum, m) => sum + m.inputTokens, 0).toLocaleString()} /{" "}
                          {selectedConversation.messages.reduce((sum, m) => sum + m.outputTokens, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Voice Assistant Metrics */}
                  {selectedConversation.usageRecords && selectedConversation.usageRecords.length > 0 && (
                    <div className="space-y-2 mt-4 animate-fade-in-up">
                      <h5 className="text-xs font-bold text-[var(--text-primary)]">Voice Assistant Metrics</h5>
                      <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] space-y-3.5 text-xs text-[var(--text-secondary)]">
                        {(() => {
                          const voice = getConversationVoiceMetrics(selectedConversation);
                          return (
                            <>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-[10px] text-[var(--text-tertiary)] block">Speech Recognition (STT)</span>
                                  <span className="font-semibold text-[var(--text-primary)]">
                                    {voice.sttRequests} request{voice.sttRequests !== 1 && "s"} · {Math.round(voice.sttDuration)}s duration
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-[var(--text-tertiary)] block">Speech Synthesis (TTS)</span>
                                  <span className="font-semibold text-[var(--text-primary)]">
                                    {voice.ttsRequests} request{voice.ttsRequests !== 1 && "s"} · {voice.ttsCharacters.toLocaleString()} chars
                                  </span>
                                </div>
                              </div>
                              <div className="pt-2.5 border-t border-[var(--border-primary)]/50 grid grid-cols-3 gap-2 text-[10px]">
                                <div>
                                  <span className="text-[var(--text-tertiary)] block">LLM Chat Cost</span>
                                  <span className="font-semibold text-[var(--text-secondary)] font-mono">${voice.llmCost.toFixed(4)}</span>
                                </div>
                                <div>
                                  <span className="text-[var(--text-tertiary)] block">Voice Cost</span>
                                  <span className="font-semibold text-[var(--text-secondary)] font-mono">${voice.voiceCost.toFixed(4)}</span>
                                </div>
                                <div>
                                  <span className="text-[var(--text-tertiary)] block">Total Cost</span>
                                  <span className="font-extrabold text-[var(--brand-emerald)] font-mono">${voice.totalCost.toFixed(4)}</span>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Auditor Sub-View: Timeline */}
              {activeView === "timeline" && (
                <div className="flex-1 p-5 overflow-y-auto max-h-[460px] space-y-4 relative before:absolute before:inset-y-0 before:left-9 before:w-0.5 before:bg-[var(--border-primary)]">
                  {/* Start Item */}
                  <div className="flex items-start gap-3 relative">
                    <div className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center shrink-0 z-10 text-[10px] font-bold text-[var(--text-secondary)]">
                      🚀
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-xs flex-grow">
                      <span className="font-semibold text-[var(--text-primary)] block">Chat Session Initialized</span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        Visitor initiated connection to the widget.
                      </span>
                    </div>
                  </div>

                  {/* Iterate messages to build interaction flow */}
                  {selectedConversation.messages.map((msg) => {
                    const isUser = msg.role === "USER";
                    const suggestions = getMessageSuggestions(msg);
                    const products = getMessageProducts(msg);

                    if (isUser) {
                      return (
                        <div key={msg.id} className="flex items-start gap-3 relative">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0 z-10 text-xs text-blue-400">
                            👤
                          </div>
                          <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-xs flex-grow">
                            <span className="font-semibold text-[var(--text-primary)] block">User Interaction</span>
                            <p className="text-[var(--text-secondary)] mt-1">{msg.content}</p>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div key={msg.id} className="flex items-start gap-3 relative space-y-2 flex-col">
                          <div className="flex items-start gap-3 w-full">
                            <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0 z-10 text-xs text-purple-400">
                              🤖
                            </div>
                            <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-xs flex-grow">
                              <span className="font-semibold text-[var(--text-primary)] block">AI Assistant response</span>
                              <p className="text-[var(--text-secondary)] mt-1 line-clamp-3 leading-relaxed">
                                {msg.content}
                              </p>
                              {!!suggestions && (
                                <div className="mt-2 pt-2 border-t border-[var(--border-primary)]/50 flex flex-wrap gap-1">
                                  <span className="text-[9px] text-[var(--text-muted)] mr-1">Chips presented:</span>
                                  {suggestions.map((s: string) => (
                                    <span key={s} className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[9px] text-[var(--text-secondary)]">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {!!products && (
                                <div className="mt-2 pt-2 border-t border-[var(--border-primary)]/50 space-y-1">
                                  <span className="text-[9px] text-[var(--text-muted)] block">Fetched catalog products:</span>
                                  {products.map((prod: unknown) => {
                                    const p = prod as AnalyticsProduct;
                                    return (
                                      <div key={p.id} className="flex items-center justify-between text-[10px] text-[var(--text-secondary)] font-medium bg-[var(--bg-secondary)] p-1 px-2 rounded">
                                        <span>{p.name}</span>
                                        <span className="text-[var(--brand-emerald)]">${Number(p.price).toFixed(2)}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}

                  {/* Exit Rating/Feedback timeline log */}
                  {selectedConversation.rating && (
                    <div className="flex items-start gap-3 relative">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 z-10 text-xs text-amber-400">
                        ⭐
                      </div>
                      <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-xs flex-grow">
                        <span className="font-semibold text-[var(--text-primary)] block">Exit Survey Rating Submitted</span>
                        <p className="text-[var(--text-secondary)] mt-1">
                          Visitor rated the session <strong>{selectedConversation.rating} / 5 stars</strong>.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Auditor Sub-View: Chat Transcript */}
              {activeView === "transcript" && (
                <div className="flex-1 p-4 overflow-y-auto max-h-[460px] bg-[var(--bg-secondary)]/30 space-y-4">
                  {selectedConversation.messages.map((msg) => {
                    const isUser = msg.role === "USER";
                    const suggestions = getMessageSuggestions(msg);
                    const products = getMessageProducts(msg);

                    return (
                      <div key={msg.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                        {/* Bubble */}
                        <div
                          className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isUser
                              ? "bg-[var(--brand-purple)] text-white rounded-tr-none shadow-sm"
                              : "bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-tl-none"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>

                          {/* Render Products within transcript bubble */}
                          {!!products && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-[var(--border-primary)]/50">
                              {products.map((prod: unknown) => {
                                const p = prod as AnalyticsProduct;
                                return (
                                  <div key={p.id} className="p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col justify-between gap-1.5 text-[10px]">
                                    <div>
                                      <span className="text-[8px] font-semibold text-[var(--brand-purple)] uppercase tracking-wider block">
                                        {p.category?.replace("_", " ")}
                                      </span>
                                      <span className="font-bold text-[var(--text-primary)] block truncate">
                                        {p.name}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                      <span className="font-bold text-[var(--text-primary)]">
                                        ${Number(p.price).toFixed(2)}
                                      </span>
                                      {p.checkoutUrl && (
                                        <a
                                          href={p.checkoutUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[9px] text-[var(--brand-purple)] font-bold flex items-center hover:underline"
                                        >
                                          Buy <ChevronRight className="w-2.5 h-2.5" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Render Suggestion Chips below message bubble */}
                        {!!suggestions && (
                          <div className="flex flex-wrap gap-1.5 mt-2 max-w-[85%]">
                            {suggestions.map((s: string) => (
                              <button
                                key={s}
                                disabled
                                className="px-3 py-1.5 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[10px] text-[var(--text-secondary)] font-medium cursor-not-allowed opacity-80"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </>
      )}
    </div>
  );
}
