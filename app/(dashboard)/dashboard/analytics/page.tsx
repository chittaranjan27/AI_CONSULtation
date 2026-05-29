import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import AnalyticsDashboard from "./AnalyticsDashboard";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;

  // Fetch month-to-date usage records date boundaries
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch all data in parallel to avoid sequential query waterfall latencies
  const [chatbots, conversations, tenant, usageRecords] = await Promise.all([
    prisma.chatbot.findMany({
      where: { tenantId },
      select: { id: true, name: true, consultationSteps: true },
      orderBy: { name: "asc" },
    }),
    prisma.conversation.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        visitor: true,
        chatbot: true,
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    }),
    prisma.usageRecord.findMany({
      where: {
        tenantId,
        createdAt: { gte: startOfMonth },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const tenantPlan = tenant?.plan || "FREE";

  // Aggregate monthly usage
  let monthlyTotalTokens = 0;
  let monthlyInputTokens = 0;
  let monthlyOutputTokens = 0;
  let monthlyCost = 0;

  // Group by chatbot
  const chatbotUsageMap: Record<string, { totalTokens: number; inputTokens: number; outputTokens: number; cost: number }> = {};
  // Group by date (YYYY-MM-DD)
  const dailyTrendsMap: Record<string, { totalTokens: number; inputTokens: number; outputTokens: number; cost: number }> = {};
  // Group by model
  const modelUsageMap: Record<string, { totalTokens: number; inputTokens: number; outputTokens: number; cost: number }> = {};

  usageRecords.forEach((record) => {
    monthlyTotalTokens += record.totalTokens;
    monthlyInputTokens += record.inputTokens;
    monthlyOutputTokens += record.outputTokens;
    monthlyCost += record.cost;

    // Chatbot grouping
    const botId = record.chatbotId || "system";
    if (!chatbotUsageMap[botId]) {
      chatbotUsageMap[botId] = { totalTokens: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
    }
    chatbotUsageMap[botId].totalTokens += record.totalTokens;
    chatbotUsageMap[botId].inputTokens += record.inputTokens;
    chatbotUsageMap[botId].outputTokens += record.outputTokens;
    chatbotUsageMap[botId].cost += record.cost;

    // Daily grouping
    const dateStr = record.createdAt.toISOString().split("T")[0];
    if (!dailyTrendsMap[dateStr]) {
      dailyTrendsMap[dateStr] = { totalTokens: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
    }
    dailyTrendsMap[dateStr].totalTokens += record.totalTokens;
    dailyTrendsMap[dateStr].inputTokens += record.inputTokens;
    dailyTrendsMap[dateStr].outputTokens += record.outputTokens;
    dailyTrendsMap[dateStr].cost += record.cost;

    // Model grouping
    const modelId = record.model || "unknown";
    if (!modelUsageMap[modelId]) {
      modelUsageMap[modelId] = { totalTokens: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
    }
    modelUsageMap[modelId].totalTokens += record.totalTokens;
    modelUsageMap[modelId].inputTokens += record.inputTokens;
    modelUsageMap[modelId].outputTokens += record.outputTokens;
    modelUsageMap[modelId].cost += record.cost;
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
      cost: monthlyCost,
    },
    usageByChatbot,
    dailyTrends,
    usageByModel,
  };

  return (
    <AnalyticsDashboard
      conversations={JSON.parse(JSON.stringify(conversations))}
      chatbots={chatbots}
      tokenStats={tokenStats}
    />
  );
}

