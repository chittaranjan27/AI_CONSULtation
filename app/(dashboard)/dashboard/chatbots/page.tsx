import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import ChatbotsList from "./ChatbotsList";

export default async function ChatbotsPage() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;

  const dbChatbots = await prisma.chatbot.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          conversations: true,
          leads: true,
        },
      },
    },
  });

  const formattedChatbots = dbChatbots.map((bot) => {
    const conversionRate = bot._count.conversations > 0
      ? ((bot._count.leads / bot._count.conversations) * 100).toFixed(1)
      : "0.0";

    return {
      id: bot.id,
      name: bot.name,
      description: bot.description,
      status: bot.status.toLowerCase(),
      aiProvider: bot.aiProvider,
      model: bot.model,
      language: bot.language,
      conversations: bot._count.conversations,
      leads: bot._count.leads,
      conversionRate,
    };
  });

  return <ChatbotsList initialChatbots={formattedChatbots} />;
}
