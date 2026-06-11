import prisma from "@/lib/db/prisma";
import { Bot, MessageSquare, Target, Cpu, Sparkles } from "lucide-react";
import ChatbotAnalyticsCharts from "@/components/admin/ChatbotAnalyticsCharts";

export default async function AdminChatbotAnalyticsPage() {

  // Query chatbots data
  const [
    totalBots,
    botsGroupedByStatus,
    providerGroup,
    modelGroup,
    allBotsWithRelations,
  ] = await Promise.all([
    prisma.chatbot.count(),
    prisma.chatbot.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.chatbot.groupBy({
      by: ["aiProvider"],
      _count: { id: true },
    }),
    prisma.chatbot.groupBy({
      by: ["model"],
      _count: { id: true },
    }),
    prisma.chatbot.findMany({
      include: {
        tenant: { select: { name: true } },
        _count: {
          select: { conversations: true, leads: true },
        },
      },
    }),
  ]);

  // Status mapping
  const statusMap = { ACTIVE: 0, INACTIVE: 0, DRAFT: 0 };
  botsGroupedByStatus.forEach((bg) => {
    if (bg.status in statusMap) {
      statusMap[bg.status as keyof typeof statusMap] = bg._count.id;
    }
  });

  // Sort rankings in JS to prevent query limits/compatibility issues
  const topActiveBots = [...allBotsWithRelations]
    .sort((a, b) => b._count.conversations - a._count.conversations)
    .slice(0, 5);

  const topConvertingBots = [...allBotsWithRelations]
    .sort((a, b) => {
      const rateA = a._count.conversations > 0 ? (a._count.leads / a._count.conversations) * 100 : 0;
      const rateB = b._count.conversations > 0 ? (b._count.leads / b._count.conversations) * 100 : 0;
      return rateB - rateA;
    })
    .slice(0, 5);

  // Map charts data
  const providerData = providerGroup.map((pg) => ({
    name: pg.aiProvider,
    value: pg._count.id,
  }));

  const modelData = modelGroup.map((mg) => ({
    name: mg.model,
    value: mg._count.id,
  }));

  const kpis = [
    { label: "Total Chatbots Deployed", value: totalBots, icon: Bot, color: "blue" },
    { label: "Active Agent instances", value: statusMap.ACTIVE, icon: Sparkles, color: "emerald" },
    { label: "Draft Configs", value: statusMap.DRAFT, icon: Cpu, color: "purple" },
    { label: "Inactive/Paused Bots", value: statusMap.INACTIVE, icon: MessageSquare, color: "pink" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Chatbot Usage & Model Analytics</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Track AI model adoptions, active agent status, and conversion rankings across all client workspaces.
        </p>
      </div>

      {/* KPI Card Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((card) => {
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
      <ChatbotAnalyticsCharts providerData={providerData} modelData={modelData} />

      {/* Rankings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking 1: Most Active Bots */}
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
                      {bot._count.conversations.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-[var(--text-tertiary)]">conversations</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ranking 2: Highest Converting Bots */}
        <div className="glass-card p-5 hover:transform-none">
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
            Top 5 Highest Converting Chatbots (Lead Rates)
          </h3>
          <div className="space-y-3">
            {topConvertingBots.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-4">No chatbots found.</p>
            ) : (
              topConvertingBots.map((bot, index) => {
                const convs = bot._count.conversations;
                const leads = bot._count.leads;
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
  );
}
