import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";
import { MessageSquare, Clock, Smile, Sparkles, Percent, Share2 } from "lucide-react";
import ConversationCharts from "@/components/admin/ConversationCharts";

export default async function AdminConversationsPage() {
  // Enforce server-side session check
  const session = await auth();

  // Parallel database queries
  const [
    totalConversations,
    statsAggregates,
    csatAggregate,
    channelsGroup,
    dailyStats,
    recentConversations,
  ] = await Promise.all([
    // Total Conversations
    prisma.conversation.count(),
    // Average durations & response times
    prisma.dailyStats.aggregate({
      _avg: {
        avgDuration: true,
        avgResponseTime: true,
        completionRate: true,
      },
      _sum: {
        conversations: true,
        messages: true,
      },
    }),
    // Average CSAT (Rating)
    prisma.conversation.aggregate({
      where: { rating: { not: null } },
      _avg: { rating: true },
    }),
    // Group by Channel
    prisma.conversation.groupBy({
      by: ["channel"],
      _count: { id: true },
    }),
    // Daily Stats for last 30 days
    prisma.dailyStats.findMany({
      where: {
        date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { date: "asc" },
    }),
    // Recent active/closed chats list
    prisma.conversation.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        tenant: { select: { name: true } },
        chatbot: { select: { name: true } },
        visitor: { select: { name: true, email: true } },
      },
    }),
  ]);

  // Calculations
  const avgDuration = statsAggregates._avg.avgDuration || 0;
  const avgResponseTime = statsAggregates._avg.avgResponseTime || 0;
  const completionRate = statsAggregates._avg.completionRate || 0;
  const rating = csatAggregate._avg.rating || 0;

  const totalConvsSum = statsAggregates._sum.conversations || 1;
  const totalMessagesSum = statsAggregates._sum.messages || 0;
  const avgMessages = totalMessagesSum / totalConvsSum;

  // Process Channel data
  const channelData = channelsGroup.map((cg) => ({
    name: cg.channel,
    value: cg._count.id,
  }));

  // Process timeline data for 30 days
  const dailyMap = new Map<string, { date: string; conversations: number; responseTime: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dailyMap.set(dateStr, {
      date: dateStr,
      conversations: 0,
      responseTime: 0,
    });
  }

  // To compute daily response time averages, we group dailyStats
  const dateCounts: Record<string, number> = {};
  dailyStats.forEach((ds) => {
    const dateStr = new Date(ds.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const dayData = dailyMap.get(dateStr);
    if (dayData) {
      dayData.conversations += ds.conversations;
      dayData.responseTime += ds.avgResponseTime;
      dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
    }
  });

  // Calculate averages for response times
  dailyMap.forEach((dayData, dateStr) => {
    const count = dateCounts[dateStr] || 1;
    dayData.responseTime = parseFloat((dayData.responseTime / count).toFixed(2));
  });

  const timelineData = Array.from(dailyMap.values());

  const statsCards = [
    { label: "Total Conversations", value: totalConversations.toLocaleString(), icon: MessageSquare, color: "blue" },
    { label: "Average Messages / Chat", value: avgMessages.toFixed(1), icon: Share2, color: "purple" },
    { label: "Average Chat Duration", value: `${Math.floor(avgDuration / 60)}m ${Math.floor(avgDuration % 60)}s`, icon: Clock, color: "cyan" },
    { label: "Avg Response Latency", value: `${avgResponseTime.toFixed(2)}s`, icon: Sparkles, color: "amber" },
    { label: "Completion Rate", value: `${completionRate.toFixed(1)}%`, icon: Percent, color: "emerald" },
    { label: "Customer Satisfaction", value: rating > 0 ? `${rating.toFixed(1)} / 5.0` : "No Ratings", icon: Smile, color: "pink" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Conversation Insights & Latency Analytics</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Monitor conversation volume, channel splits, customer satisfaction, and AI response times.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {statsCards.map((card) => {
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
              <p className="text-base font-bold text-[var(--text-primary)] mt-3 leading-none truncate">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <ConversationCharts timelineData={timelineData} channelData={channelData} />

      {/* Recent Conversations List */}
      <div className="glass-card p-5 hover:transform-none">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
          Active Chat Session Audits
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-primary)] text-[var(--text-tertiary)]">
                <th className="py-2.5 font-semibold">Visitor Name</th>
                <th className="py-2.5 font-semibold">Workspace</th>
                <th className="py-2.5 font-semibold">Chatbot Agent</th>
                <th className="py-2.5 font-semibold text-center">Channel</th>
                <th className="py-2.5 font-semibold text-center">Satisfaction Rating</th>
                <th className="py-2.5 font-semibold text-center">Status</th>
                <th className="py-2.5 font-semibold text-right">Started At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)] text-[var(--text-secondary)]">
              {recentConversations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-[var(--text-muted)]">
                    No active chat sessions found.
                  </td>
                </tr>
              ) : (
                recentConversations.map((c) => (
                  <tr key={c.id} className="hover:text-white">
                    <td className="py-3">
                      <div>
                        <p className="font-semibold text-xs text-text-primary">
                          {c.visitor?.name || "Anonymous Visitor"}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)]">{c.visitor?.email || "N/A"}</p>
                      </div>
                    </td>
                    <td className="py-3 text-xs">{c.tenant?.name}</td>
                    <td className="py-3 text-xs">{c.chatbot?.name}</td>
                    <td className="py-3 text-center text-xs uppercase font-mono">{c.channel}</td>
                    <td className="py-3 text-center font-bold text-xs">
                      {c.rating ? `${c.rating} / 5` : <span className="text-[var(--text-muted)] font-normal">-</span>}
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`badge text-[9px] py-0 px-2 uppercase font-bold ${
                          c.status === "ACTIVE"
                            ? "badge-emerald"
                            : c.status === "HANDOFF"
                            ? "badge-amber"
                            : "badge-purple"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-xs">
                      {new Date(c.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
