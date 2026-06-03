import { createChatCompletion } from "@/lib/ai/chat";
import prisma from "@/lib/db/prisma";
import { getChatbotTenant } from "@/lib/db/cache";

/** Extract text from a UIMessage's parts array (AI SDK v6 format) */
function extractText(message: { role: string; content?: string; parts?: Array<{ type: string; text?: string }> }): string {
  // Support both v6 parts format and legacy content format
  if (message.parts && Array.isArray(message.parts)) {
    return message.parts
      .filter((p) => p.type === "text" && p.text)
      .map((p) => p.text)
      .join("");
  }
  return message.content || "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { chatbotId, messages, conversationId, visitorId, visitorName, visitorEmail, mode, language } = body;

    if (!chatbotId || !messages || !Array.isArray(messages)) {
      return new Response("Missing chatbotId or messages", { status: 400 });
    }

    // ── Parallel: Verify chatbot + create visitor simultaneously ──
    const needsVisitor = !visitorId && (visitorName || visitorEmail);
    const [chatbot, visitor] = await Promise.all([
      getChatbotTenant(chatbotId),
      needsVisitor
        ? prisma.visitor.create({
          data: {
            name: visitorName || null,
            email: visitorEmail || null,
          },
        })
        : Promise.resolve(null),
    ]);

    if (!chatbot) {
      return new Response("Chatbot not found", { status: 404 });
    }

    if (chatbot.status !== "ACTIVE") {
      return new Response("Chatbot is not active", { status: 403 });
    }

    const resolvedVisitorId = visitorId || visitor?.id || null;

    // Convert UIMessages (v6 parts format) to plain ChatMessage format
    const chatMessages = messages.map((m: { role: string; content?: string; parts?: Array<{ type: string; text?: string }> }) => ({
      role: m.role as "user" | "assistant" | "system",
      content: extractText(m),
    }));

    // Create conversation before streaming if it doesn't exist yet
    let resolvedConversationId = conversationId;
    if (!resolvedConversationId) {
      const conversation = await prisma.conversation.create({
        data: {
          tenantId: chatbot.tenantId,
          chatbotId: chatbotId,
          visitorId: resolvedVisitorId,
          status: "ACTIVE",
          language: "en",
          metadata: {
            currentStep: 1,
          },
        },
      });
      resolvedConversationId = conversation.id;

      // Fire-and-forget: Track new vs returning user + increment DailyStats without blocking the stream
      (async () => {
        try {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const isNewUser = resolvedVisitorId
            ? await prisma.visitor.findUnique({
                where: { id: resolvedVisitorId },
                select: { firstSeenAt: true },
              }).then(v => {
                if (!v) return true;
                const firstSeen = new Date(v.firstSeenAt);
                firstSeen.setHours(0, 0, 0, 0);
                return firstSeen.getTime() === today.getTime();
              })
            : true; // Anonymous = new

          await prisma.dailyStats.upsert({
            where: {
              tenantId_chatbotId_date: {
                tenantId: chatbot.tenantId,
                chatbotId,
                date: today,
              },
            },
            create: {
              tenantId: chatbot.tenantId,
              chatbotId,
              date: today,
              conversations: 1,
              ...(isNewUser ? { newUsers: 1 } : { returningUsers: 1 }),
            },
            update: {
              conversations: { increment: 1 },
              ...(isNewUser
                ? { newUsers: { increment: 1 } }
                : { returningUsers: { increment: 1 } }),
            },
          });
        } catch (err) {
          console.error("DailyStats conversation upsert error:", err);
        }
      })();
    }

    // Execute streaming chat completion
    const result = await createChatCompletion({
      chatbotId,
      tenantId: chatbot.tenantId,
      conversationId: resolvedConversationId,
      visitorId: resolvedVisitorId,
      messages: chatMessages,
      mode,
      language,
    });

    // Return as UI message stream response (AI SDK v6 format)
    const response = result.toUIMessageStreamResponse();
    response.headers.set("X-Conversation-Id", resolvedConversationId);
    return response;
  } catch (error) {
    console.error("[CHAT_API]", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
