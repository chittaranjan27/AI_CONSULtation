import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import AnalyticsDashboard from "./AnalyticsDashboard";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;
  const params = await searchParams;

  // Parse date range from searchParams, default to start-of-month → now
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const fromDate = params.from ? new Date(params.from) : startOfMonth;
  const toDate = params.to ? new Date(params.to + "T23:59:59.999Z") : now;

  // Ensure valid dates
  const validFrom = isNaN(fromDate.getTime()) ? startOfMonth : fromDate;
  const validTo = isNaN(toDate.getTime()) ? now : toDate;

  // Fetch all data in parallel to avoid sequential query waterfall latencies
  const [chatbots, conversations, tenant, usageRecords] = await Promise.all([
    prisma.chatbot.findMany({
      where: { tenantId },
      select: { id: true, name: true, consultationSteps: true },
      orderBy: { name: "asc" },
    }),
    prisma.conversation.findMany({
      where: {
        tenantId,
        createdAt: { gte: validFrom, lte: validTo },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        visitor: true,
        chatbot: true,
        messages: {
          orderBy: { createdAt: "asc" },
        },
        usageRecords: true,
      },
    }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    }),
    prisma.usageRecord.findMany({
      where: {
        tenantId,
        createdAt: { gte: validFrom, lte: validTo },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const tenantPlan = tenant?.plan || "FREE";

  // ── Aggregate monthly usage, split by request type ──
  let monthlyTotalTokens = 0;
  let monthlyInputTokens = 0;
  let monthlyOutputTokens = 0;
  let monthlyChatCost = 0;

  // Voice aggregates
  let monthlyVoiceCost = 0;
  let monthlySttRequests = 0;
  let monthlySttDuration = 0;
  let monthlyTtsRequests = 0;
  let monthlyTtsCharacters = 0;

  // Group by chatbot
  const chatbotUsageMap: Record<string, {
    totalTokens: number; inputTokens: number; outputTokens: number; chatCost: number;
    sttRequests: number; sttDuration: number; ttsRequests: number; ttsCharacters: number; voiceCost: number;
  }> = {};
  // Group by date (YYYY-MM-DD)
  const dailyTrendsMap: Record<string, {
    totalTokens: number; inputTokens: number; outputTokens: number; chatCost: number;
    sttRequests: number; sttDuration: number; ttsRequests: number; ttsCharacters: number; voiceCost: number;
  }> = {};
  // Group by model
  const modelUsageMap: Record<string, { totalTokens: number; inputTokens: number; outputTokens: number; cost: number }> = {};

  const initBucket = () => ({
    totalTokens: 0, inputTokens: 0, outputTokens: 0, chatCost: 0,
    sttRequests: 0, sttDuration: 0, ttsRequests: 0, ttsCharacters: 0, voiceCost: 0,
  });

  usageRecords.forEach((record) => {
    const reqType = record.requestType || "LLM";
    const botId = record.chatbotId || "system";
    const dateStr = record.createdAt.toISOString().split("T")[0];

    // Ensure buckets exist
    if (!chatbotUsageMap[botId]) chatbotUsageMap[botId] = initBucket();
    if (!dailyTrendsMap[dateStr]) dailyTrendsMap[dateStr] = initBucket();

    if (reqType === "LLM") {
      // LLM / Chat metrics
      monthlyTotalTokens += record.totalTokens;
      monthlyInputTokens += record.inputTokens;
      monthlyOutputTokens += record.outputTokens;
      monthlyChatCost += record.cost;

      chatbotUsageMap[botId].totalTokens += record.totalTokens;
      chatbotUsageMap[botId].inputTokens += record.inputTokens;
      chatbotUsageMap[botId].outputTokens += record.outputTokens;
      chatbotUsageMap[botId].chatCost += record.cost;

      dailyTrendsMap[dateStr].totalTokens += record.totalTokens;
      dailyTrendsMap[dateStr].inputTokens += record.inputTokens;
      dailyTrendsMap[dateStr].outputTokens += record.outputTokens;
      dailyTrendsMap[dateStr].chatCost += record.cost;

      // Model grouping (LLM only)
      const modelId = record.model || "unknown";
      if (!modelUsageMap[modelId]) {
        modelUsageMap[modelId] = { totalTokens: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
      }
      modelUsageMap[modelId].totalTokens += record.totalTokens;
      modelUsageMap[modelId].inputTokens += record.inputTokens;
      modelUsageMap[modelId].outputTokens += record.outputTokens;
      modelUsageMap[modelId].cost += record.cost;
    } else if (reqType === "STT") {
      // Voice STT metrics
      const dur = record.audioDuration || 0;
      monthlySttRequests += 1;
      monthlySttDuration += dur;
      monthlyVoiceCost += record.cost;

      chatbotUsageMap[botId].sttRequests += 1;
      chatbotUsageMap[botId].sttDuration += dur;
      chatbotUsageMap[botId].voiceCost += record.cost;

      dailyTrendsMap[dateStr].sttRequests += 1;
      dailyTrendsMap[dateStr].sttDuration += dur;
      dailyTrendsMap[dateStr].voiceCost += record.cost;
    } else if (reqType === "TTS") {
      // Voice TTS metrics
      const chars = record.characterCount || 0;
      monthlyTtsRequests += 1;
      monthlyTtsCharacters += chars;
      monthlyVoiceCost += record.cost;

      chatbotUsageMap[botId].ttsRequests += 1;
      chatbotUsageMap[botId].ttsCharacters += chars;
      chatbotUsageMap[botId].voiceCost += record.cost;

      dailyTrendsMap[dateStr].ttsRequests += 1;
      dailyTrendsMap[dateStr].ttsCharacters += chars;
      dailyTrendsMap[dateStr].voiceCost += record.cost;
    }
  });

  // Format chatbot usage
  const usageByChatbot = Object.entries(chatbotUsageMap).map(([botId, usage]) => {
    const chatbotName = chatbots.find(b => b.id === botId)?.name || (botId === "system" ? "System / General" : "Unknown Chatbot");
    return {
      chatbotId: botId,
      chatbotName,
      ...usage,
    };
  });

  // Format daily trends
  const dailyTrends = Object.entries(dailyTrendsMap).map(([date, usage]) => {
    const dateObj = new Date(date);
    const label = dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return {
      date,
      label,
      ...usage,
    };
  }).sort((a, b) => a.date.localeCompare(b.date));

  // Format model usage
  const usageByModel = Object.entries(modelUsageMap).map(([modelId, usage]) => {
    return {
      modelId,
      ...usage,
    };
  });

  const tokenStats = {
    tenantPlan,
    monthlyUsage: {
      totalTokens: monthlyTotalTokens,
      inputTokens: monthlyInputTokens,
      outputTokens: monthlyOutputTokens,
      cost: monthlyChatCost + monthlyVoiceCost, // Combined for plan limit checks
    },
    chatUsage: {
      totalTokens: monthlyTotalTokens,
      inputTokens: monthlyInputTokens,
      outputTokens: monthlyOutputTokens,
      cost: monthlyChatCost,
    },
    voiceUsage: {
      sttRequests: monthlySttRequests,
      sttDuration: monthlySttDuration,
      ttsRequests: monthlyTtsRequests,
      ttsCharacters: monthlyTtsCharacters,
      cost: monthlyVoiceCost,
      totalRequests: monthlySttRequests + monthlyTtsRequests,
    },
    usageByChatbot,
    dailyTrends,
    usageByModel,
  };

  // ── Phase 3: Consultation Funnel ──
  // Count how many conversations reached each step
  interface ConsultationStep {
    stepNumber: number;
    title: string;
  }

  const funnelMap: Record<number, number> = {};
  conversations.forEach((conv) => {
    const meta = conv.metadata as { currentStep?: number } | null;
    const reachedStep = meta?.currentStep || 1;
    // Increment all steps up to and including reachedStep
    for (let s = 1; s <= reachedStep; s++) {
      funnelMap[s] = (funnelMap[s] || 0) + 1;
    }
  });

  // Collect step labels from chatbot configurations
  const funnelSteps = chatbots.flatMap((b) => {
    const steps = b.consultationSteps as ConsultationStep[] | null;
    return steps
      ? steps.map((s) => ({ stepNumber: s.stepNumber, title: s.title }))
      : [];
  });

  // Deduplicate steps by stepNumber (in case multiple chatbots share step numbers)
  const uniqueSteps = Object.values(
    funnelSteps.reduce<Record<number, { stepNumber: number; title: string }>>(
      (acc, s) => {
        if (!acc[s.stepNumber]) acc[s.stepNumber] = s;
        return acc;
      },
      {}
    )
  ).sort((a, b) => a.stepNumber - b.stepNumber);

  const funnelData = uniqueSteps.map((step) => ({
    stepNumber: step.stepNumber,
    title: step.title,
    count: funnelMap[step.stepNumber] || 0,
  }));

  // ── Phase 3: Language Distribution ──
  const languageMap: Record<string, number> = {};
  conversations.forEach((conv) => {
    const lang = conv.language || "en";
    languageMap[lang] = (languageMap[lang] || 0) + 1;
  });

  const languageDistribution = Object.entries(languageMap)
    .map(([lang, count]) => ({ language: lang, count }))
    .sort((a, b) => b.count - a.count);

  // ── Phase 3: Engagement Events (from AnalyticsEvent model) ──
  const analyticsEventsGrouped = await prisma.analyticsEvent.groupBy({
    by: ["eventType"],
    where: {
      tenantId,
      createdAt: { gte: validFrom, lte: validTo },
    },
    _count: {
      eventType: true,
    },
  });

  const engagementCounts: Record<string, number> = {};
  analyticsEventsGrouped.forEach((group) => {
    engagementCounts[group.eventType] = group._count.eventType;
  });

  return (
    <AnalyticsDashboard
      conversations={JSON.parse(JSON.stringify(conversations))}
      chatbots={chatbots}
      tokenStats={tokenStats}
      funnelData={funnelData}
      languageDistribution={languageDistribution}
      engagementCounts={engagementCounts}
      dateRange={{
        from: validFrom.toISOString().split("T")[0],
        to: validTo.toISOString().split("T")[0],
      }}
    />
  );
}
