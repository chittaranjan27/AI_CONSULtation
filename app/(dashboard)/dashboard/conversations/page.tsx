import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import ConversationsList from "./ConversationsList";

export default async function ConversationsPage() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;

  // Fetch chatbots and conversations in parallel
  const [chatbots, dbConversations] = await Promise.all([
    prisma.chatbot.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        status: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.conversation.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 150,
      include: {
        visitor: true,
        chatbot: true,
        messages: {
          orderBy: { createdAt: "asc" },
        },
        usageRecords: true,
      },
    }),
  ]);

  // Serialize dates to prevent Next.js Client Component serialization error
  const conversationsSerialized = JSON.parse(JSON.stringify(dbConversations));
  const chatbotsSerialized = JSON.parse(JSON.stringify(chatbots));

  return (
    <ConversationsList
      initialConversations={conversationsSerialized}
      chatbots={chatbotsSerialized}
    />
  );
}

