import {
  MessageSquare,
  Users,
  TrendingUp,
  Bot,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Target,
  DollarSign,
  Sparkles,
  ArrowRight,
  BookOpen,
  Code,
} from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";
import { redirect } from "next/navigation";

function formatTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;

  // Date calculations for metrics comparisons
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch all dashboard data in parallel to prevent query waterfall latencies
  const [
    totalConversationsCount,
    currentPeriodConvs,
    previousPeriodConvs,
    leadsCapturedCount,
    currentPeriodLeads,
    previousPeriodLeads,
    prevConversations,
    prevLeads,
    aiCostAggregate,
    currentPeriodCostAgg,
    previousPeriodCostAgg,
    dbConversations,
    dbLeads,
    dbChatbots,
  ] = await Promise.all([
    prisma.conversation.count({ where: { tenantId } }),
    prisma.conversation.count({
      where: {
        tenantId,
        createdAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.conversation.count({
      where: {
        tenantId,
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
    }),
    prisma.lead.count({ where: { tenantId } }),
    prisma.lead.count({
      where: {
        tenantId,
        createdAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.lead.count({
      where: {
        tenantId,
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
    }),
    prisma.conversation.count({
      where: {
        tenantId,
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
    }),
    prisma.lead.count({
      where: {
        tenantId,
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
    }),
    prisma.usageRecord.aggregate({
      where: {
        tenantId,
        createdAt: { gte: firstDayOfMonth },
      },
      _sum: { cost: true },
    }),
    prisma.usageRecord.aggregate({
      where: {
        tenantId,
        createdAt: { gte: sevenDaysAgo },
      },
      _sum: { cost: true },
    }),
    prisma.usageRecord.aggregate({
      where: {
        tenantId,
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
      _sum: { cost: true },
    }),
    prisma.conversation.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        visitor: true,
        chatbot: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.lead.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.chatbot.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        _count: {
          select: {
            conversations: true,
            leads: true,
          },
        },
      },
    }),
  ]);

  let convChange = "+0.0%";
  let convTrend: "up" | "down" = "up";
  if (previousPeriodConvs > 0) {
    const diff = ((currentPeriodConvs - previousPeriodConvs) / previousPeriodConvs) * 100;
    convChange = `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
    convTrend = diff >= 0 ? "up" : "down";
  } else if (currentPeriodConvs > 0) {
    convChange = "+100.0%";
    convTrend = "up";
  }

  let leadChange = "+0.0%";
  let leadTrend: "up" | "down" = "up";
  if (previousPeriodLeads > 0) {
    const diff = ((currentPeriodLeads - previousPeriodLeads) / previousPeriodLeads) * 100;
    leadChange = `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
    leadTrend = diff >= 0 ? "up" : "down";
  } else if (currentPeriodLeads > 0) {
    leadChange = "+100.0%";
    leadTrend = "up";
  }

  // Calculate conversion rate & trend
  const conversionRateVal = totalConversationsCount > 0
    ? (leadsCapturedCount / totalConversationsCount) * 100
    : 0;

  const prevConversionRateVal = prevConversations > 0
    ? (prevLeads / prevConversations) * 100
    : 0;

  let convRateChange = "+0.0%";
  let convRateTrend: "up" | "down" = "up";
  const rateDiff = conversionRateVal - prevConversionRateVal;
  convRateChange = `${rateDiff >= 0 ? "+" : ""}${rateDiff.toFixed(1)}%`;
  convRateTrend = rateDiff >= 0 ? "up" : "down";

  // AI Cost calculations
  const aiCostVal = aiCostAggregate._sum.cost || 0;
  const currentCost = currentPeriodCostAgg._sum.cost || 0;
  const prevCost = previousPeriodCostAgg._sum.cost || 0;

  let costChange = "+0.0%";
  let costTrend: "up" | "down" = "up";
  if (prevCost > 0) {
    const diff = ((currentCost - prevCost) / prevCost) * 100;
    costChange = `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
    costTrend = diff >= 0 ? "up" : "down";
  } else if (currentCost > 0) {
    costChange = "+100.0%";
    costTrend = "up";
  }

  const recentConversations = dbConversations.map((conv) => {
    const visitorName = conv.visitor?.name || conv.visitor?.email?.split("@")[0] || "Anonymous";
    const latestMessage = conv.messages[0]?.content || "No messages yet";
    return {
      name: visitorName,
      message: latestMessage,
      time: formatTimeAgo(conv.createdAt),
      status: conv.status.toLowerCase(),
      chatbot: conv.chatbot.name,
    };
  });

  const recentLeads = dbLeads.map((lead) => ({
    name: lead.name || "Unknown Lead",
    email: lead.email || "No email",
    score: lead.score,
    status: lead.status.charAt(0) + lead.status.slice(1).toLowerCase(),
  }));

  const chatbots = dbChatbots.map((bot) => ({
    name: bot.name,
    status: bot.status.toLowerCase(),
    conversations: bot._count.conversations,
    leads: bot._count.leads,
  }));

  const stats = [
    {
      label: "Total Conversations",
      value: totalConversationsCount.toLocaleString(),
      change: convChange,
      trend: convTrend,
      icon: MessageSquare,
      color: "purple",
    },
    {
      label: "Leads Captured",
      value: leadsCapturedCount.toLocaleString(),
      change: leadChange,
      trend: leadTrend,
      icon: Users,
      color: "blue",
    },
    {
      label: "Conversion Rate",
      value: `${conversionRateVal.toFixed(1)}%`,
      change: convRateChange,
      trend: convRateTrend,
      icon: TrendingUp,
      color: "emerald",
    },
    {
      label: "AI Cost (MTD)",
      value: `$${aiCostVal.toFixed(2)}`,
      change: costChange,
      trend: costTrend,
      icon: DollarSign,
      color: "amber",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Welcome back! Here&apos;s what&apos;s happening today.
          </p>
        </div>
        <Link href="/dashboard/chatbots" className="btn-primary text-sm py-2.5 px-5">
          <Plus className="w-4 h-4" />
          New Chatbot
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="glass-card p-5 hover:transform-none"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: `color-mix(in srgb, var(--brand-${stat.color}) 12%, transparent)`,
                  }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: `var(--brand-${stat.color})` }}
                  />
                </div>
                <div
                  className={`flex items-center gap-0.5 text-xs font-medium ${
                    stat.trend === "up"
                      ? "text-[var(--brand-emerald)]"
                      : "text-[var(--brand-amber)]"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {stat.change}
                </div>
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {stat.value}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      {dbChatbots.length === 0 ? (
        /* Premium Empty Onboarding State */
        <div className="glass-card p-8 md:p-12 hover:transform-none flex flex-col items-center max-w-4xl mx-auto text-center space-y-8 relative overflow-hidden">
          {/* Decorative glowing background gradients */}
          <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20 flex items-center justify-center relative shadow-lg">
            <Sparkles className="w-8 h-8 text-[var(--brand-purple)]" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Create Your First AI Chatbot
            </h2>
            <p className="text-base text-[var(--text-secondary)] max-w-xl mx-auto">
              Unlock the power of automated customer support and high-conversion lead generation by building a customized AI assistant.
            </p>
          </div>

          {/* Steps Walkthrough */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mt-4">
            <div className="p-5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] space-y-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-xs font-bold text-[var(--brand-purple)]">
                1
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-[var(--brand-purple)]" /> Set Personality
              </h3>
              <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                Give your chatbot a name, define its tone, select a language, and choose the AI model (e.g. GPT-4o-mini).
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-xs font-bold text-[var(--brand-blue)]">
                2
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[var(--brand-blue)]" /> Train the AI
              </h3>
              <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                Add files, documentation, or your website URLs. The AI immediately understands and uses this knowledge.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-xs font-bold text-[var(--brand-emerald)]">
                3
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <Code className="w-4 h-4 text-[var(--brand-emerald)]" /> Embed Widget
              </h3>
              <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                Copy one line of script, paste it into your website, and start converting visitors into qualified leads.
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Link
              href="/dashboard/chatbots"
              className="btn-primary text-sm py-3 px-8 flex items-center gap-2 group shadow-xl hover:shadow-purple-500/10 transition-all"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      ) : (
        /* Main Grid */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Conversations */}
            <div className="lg:col-span-2 glass-card p-0 hover:transform-none">
              <div className="flex items-center justify-between p-5 pb-0">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  Recent Conversations
                </h2>
                <Link
                  href="/dashboard/conversations"
                  className="text-xs text-[var(--brand-purple)] hover:text-purple-400 transition-colors"
                >
                  View all →
                </Link>
              </div>
              <div className="p-3">
                {recentConversations.length === 0 ? (
                  <div className="text-center py-8 text-sm text-[var(--text-tertiary)]">
                    No conversations captured yet.
                  </div>
                ) : (
                  recentConversations.map((conv, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-glass-hover)] cursor-pointer transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-purple-500/20 flex items-center justify-center text-xs font-bold text-[var(--brand-purple)] shrink-0">
                        {conv.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {conv.name}
                          </p>
                          <span className="badge badge-purple text-[10px] shrink-0">
                            {conv.chatbot}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)] truncate">
                          {conv.message}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {conv.time}
                        </span>
                        {conv.status === "active" && (
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Leads */}
            <div className="glass-card p-0 hover:transform-none">
              <div className="flex items-center justify-between p-5 pb-0">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  Recent Leads
                </h2>
                <Link
                  href="/dashboard/leads"
                  className="text-xs text-[var(--brand-purple)] hover:text-purple-400 transition-colors"
                >
                  View all →
                </Link>
              </div>
              <div className="p-3">
                {recentLeads.length === 0 ? (
                  <div className="text-center py-8 text-sm text-[var(--text-tertiary)]">
                    No leads captured yet.
                  </div>
                ) : (
                  recentLeads.map((lead, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-glass-hover)] cursor-pointer transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border border-blue-500/20 flex items-center justify-center text-xs font-bold text-[var(--brand-blue)] shrink-0">
                        {lead.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {lead.name}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)] truncate">
                          {lead.email}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {lead.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Chatbots */}
          <div className="glass-card p-0 hover:transform-none">
            <div className="flex items-center justify-between p-5 pb-0">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Your Chatbots
              </h2>
              <Link
                href="/dashboard/chatbots"
                className="text-xs text-[var(--brand-purple)] hover:text-purple-400 transition-colors"
              >
                Manage →
              </Link>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {chatbots.map((bot) => (
                  <div
                    key={bot.name}
                    className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-[var(--brand-purple)]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {bot.name}
                        </p>
                        <span
                          className={`badge text-[10px] ${
                            bot.status === "active"
                              ? "badge-emerald"
                              : "badge-amber"
                          }`}
                        >
                          {bot.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {bot.conversations.toLocaleString()} chats
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {bot.leads} leads
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
