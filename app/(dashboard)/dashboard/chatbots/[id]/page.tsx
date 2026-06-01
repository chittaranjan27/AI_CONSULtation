import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import ChatbotEditor from "./ChatbotEditor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChatbotEditorPage({ params }: Props) {
  const session = await auth();
  
  // DEBUG: Log session state to terminal
  console.log("[CHATBOT_PAGE_DEBUG]", {
    hasSession: !!session,
    userId: session?.user?.id || "NONE",
    email: session?.user?.email || "NONE",
    tenantId: session?.user?.tenantId || "NONE",
  });

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const { id } = await params;
  
  // DEBUG: Log the chatbot query
  console.log("[CHATBOT_PAGE_DEBUG] Looking for chatbot:", { chatbotId: id, userTenantId: session.user.tenantId });

  // Fetch month-to-date usage records date boundaries
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch all data in parallel to avoid sequential query waterfall latencies
  const [chatbot, usageRecords, conversations, leads, apiKeys] = await Promise.all([
    prisma.chatbot.findUnique({
      where: { id, tenantId: session.user.tenantId },
      include: {
        documents: {
          select: {
            id: true,
            filename: true,
            fileType: true,
            fileSize: true,
            status: true,
            chunkCount: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            conversations: true,
            leads: true,
          },
        },
      },
    }),
    prisma.usageRecord.findMany({
      where: {
        chatbotId: id,
        createdAt: { gte: startOfMonth },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.conversation.findMany({
      where: { chatbotId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        visitor: true,
        messages: {
          orderBy: { createdAt: "asc" },
        },
        usageRecords: true,
      },
    }),
    prisma.lead.findMany({
      where: { chatbotId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.tenantApiKey.findMany({
      where: { tenantId: session.user.tenantId },
      select: {
        id: true,
        provider: true,
        isActive: true,
      },
    }),
  ]);

  if (!chatbot) {
    notFound();
  }

  // Aggregate monthly usage
  let monthlyTotalTokens = 0;
  let monthlyInputTokens = 0;
  let monthlyOutputTokens = 0;
  let monthlyCost = 0;

  // Group by date (YYYY-MM-DD)
  const dailyTrendsMap: Record<string, { totalTokens: number; inputTokens: number; outputTokens: number; cost: number }> = {};

  usageRecords.forEach((record) => {
    monthlyTotalTokens += record.totalTokens;
    monthlyInputTokens += record.inputTokens;
    monthlyOutputTokens += record.outputTokens;
    monthlyCost += record.cost;

    const dateStr = record.createdAt.toISOString().split("T")[0];
    if (!dailyTrendsMap[dateStr]) {
      dailyTrendsMap[dateStr] = { totalTokens: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
    }
    dailyTrendsMap[dateStr].totalTokens += record.totalTokens;
    dailyTrendsMap[dateStr].inputTokens += record.inputTokens;
    dailyTrendsMap[dateStr].outputTokens += record.outputTokens;
    dailyTrendsMap[dateStr].cost += record.cost;
  });

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

  const chatbotAnalytics = {
    monthlyUsage: {
      totalTokens: monthlyTotalTokens,
      inputTokens: monthlyInputTokens,
      outputTokens: monthlyOutputTokens,
      cost: monthlyCost,
    },
    dailyTrends,
    conversations: JSON.parse(JSON.stringify(conversations)),
    leads: JSON.parse(JSON.stringify(leads)),
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <ChatbotEditor
      chatbot={JSON.parse(JSON.stringify(chatbot))}
      apiKeys={apiKeys}
      appUrl={appUrl}
      analytics={chatbotAnalytics}
    />
  );
}

