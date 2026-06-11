import prisma from "@/lib/db/prisma";
import { LeadStatus } from "@prisma/client";
import AnalyticsManagerClient from "@/components/admin/AnalyticsManagerClient";

export default async function AdminAnalyticsPage() {
  // Parallel DB queries combining AI tokens, chatbot analytics, and leads analytics
  const [
    // 1. AI Tokens Aggregates
    llmAggregate,
    sttAggregate,
    ttsAggregate,
    totalAggregate,
    providerGroupAI,
    dailyStats,

    // 2. Chatbot Analytics
    totalBots,
    botsGroupedByStatus,
    providerGroupBots,
    modelGroupBots,
    allBotsWithRelations,

    // 3. Lead Analytics
    totalLeads,
    qualifiedLeads,
    wonLeads,
    totalConvs,
    sourceGroupLeads,
    recentLeads,
  ] = await Promise.all([
    // AI Aggregate LLM
    prisma.usageRecord.aggregate({
      where: { requestType: "LLM" },
      _sum: { inputTokens: true, outputTokens: true, totalTokens: true, cost: true },
      _count: { id: true },
    }),
    // AI Aggregate STT
    prisma.usageRecord.aggregate({
      where: { requestType: "STT" },
      _sum: { audioDuration: true, cost: true },
      _count: { id: true },
    }),
    // AI Aggregate TTS
    prisma.usageRecord.aggregate({
      where: { requestType: "TTS" },
      _sum: { characterCount: true, cost: true },
      _count: { id: true },
    }),
    // AI Aggregate Total
    prisma.usageRecord.aggregate({
      _sum: { cost: true },
    }),
    // AI Group by provider cost
    prisma.usageRecord.groupBy({
      by: ["provider"],
      _sum: { cost: true },
    }),
    // DailyStats for last 30 days (contains all timeline fields)
    prisma.dailyStats.findMany({
      where: {
        date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        date: true,
        totalTokens: true,
        sttDuration: true,
        ttsCharacters: true,
        totalCost: true,
        leadsCaptured: true,
      },
      orderBy: { date: "asc" },
    }),

    // Chatbot totals
    prisma.chatbot.count(),
    // Chatbots by status
    prisma.chatbot.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    // Chatbots by provider
    prisma.chatbot.groupBy({
      by: ["aiProvider"],
      _count: { id: true },
    }),
    // Chatbots by model
    prisma.chatbot.groupBy({
      by: ["model"],
      _count: { id: true },
    }),
    // All chatbots with tenant and conversation/leads counts
    prisma.chatbot.findMany({
      include: {
        tenant: { select: { name: true } },
        _count: {
          select: { conversations: true, leads: true },
        },
      },
    }),

    // Lead totals
    prisma.lead.count(),
    // Qualified leads
    prisma.lead.count({ where: { status: LeadStatus.QUALIFIED } }),
    // Won leads
    prisma.lead.count({ where: { status: LeadStatus.WON } }),
    // Conversations total (for conversion calculation)
    prisma.conversation.count(),
    // Leads by source
    prisma.lead.groupBy({
      by: ["source"],
      _count: { id: true },
    }),
    // Recent leads
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        tenant: { select: { name: true } },
        chatbot: { select: { name: true } },
      },
    }),
  ]);

  // Format objects for JSON compatibility
  const dailyStatsJson = dailyStats.map(ds => ({
    date: ds.date.toISOString(),
    totalTokens: ds.totalTokens,
    sttDuration: ds.sttDuration,
    ttsCharacters: ds.ttsCharacters,
    totalCost: ds.totalCost,
    leadsCaptured: ds.leadsCaptured,
  }));

  const allBotsJson = allBotsWithRelations.map(bot => ({
    id: bot.id,
    name: bot.name,
    status: bot.status,
    model: bot.model,
    aiProvider: bot.aiProvider,
    tenant: bot.tenant ? { name: bot.tenant.name } : null,
    conversationsCount: bot._count.conversations,
    leadsCount: bot._count.leads,
  }));

  const recentLeadsJson = recentLeads.map(l => ({
    id: l.id,
    name: l.name,
    email: l.email,
    phone: l.phone,
    status: l.status,
    score: l.score,
    source: l.source,
    createdAt: l.createdAt.toISOString(),
    tenant: l.tenant ? { name: l.tenant.name } : null,
    chatbot: l.chatbot ? { name: l.chatbot.name } : null,
  }));

  const providerGroupAIJson = providerGroupAI.map(p => ({
    provider: p.provider,
    cost: p._sum.cost || 0,
  }));

  const botsGroupedByStatusJson = botsGroupedByStatus.map(b => ({
    status: b.status,
    count: b._count.id,
  }));

  const providerGroupBotsJson = providerGroupBots.map(p => ({
    aiProvider: p.aiProvider,
    count: p._count.id,
  }));

  const modelGroupBotsJson = modelGroupBots.map(m => ({
    model: m.model,
    count: m._count.id,
  }));

  const sourceGroupLeadsJson = sourceGroupLeads.map(s => ({
    source: s.source,
    count: s._count.id,
  }));

  return (
    <AnalyticsManagerClient
      llmAggregate={{
        count: llmAggregate._count.id,
        inputTokens: llmAggregate._sum.inputTokens || 0,
        outputTokens: llmAggregate._sum.outputTokens || 0,
        totalTokens: llmAggregate._sum.totalTokens || 0,
        cost: llmAggregate._sum.cost || 0,
      }}
      sttAggregate={{
        count: sttAggregate._count.id,
        audioDuration: sttAggregate._sum.audioDuration || 0,
        cost: sttAggregate._sum.cost || 0,
      }}
      ttsAggregate={{
        count: ttsAggregate._count.id,
        characterCount: ttsAggregate._sum.characterCount || 0,
        cost: ttsAggregate._sum.cost || 0,
      }}
      totalAICost={totalAggregate._sum.cost || 0}
      providerGroupAI={providerGroupAIJson}
      dailyStats={dailyStatsJson}

      totalBots={totalBots}
      botsGroupedByStatus={botsGroupedByStatusJson}
      providerGroupBots={providerGroupBotsJson}
      modelGroupBots={modelGroupBotsJson}
      allBots={allBotsJson}

      totalLeads={totalLeads}
      qualifiedLeads={qualifiedLeads}
      wonLeads={wonLeads}
      totalConvs={totalConvs}
      sourceGroupLeads={sourceGroupLeadsJson}
      recentLeads={recentLeadsJson}
    />
  );
}
