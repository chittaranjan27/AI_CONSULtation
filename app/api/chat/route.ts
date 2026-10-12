import { createChatCompletion } from "@/lib/ai/chat";
import prisma from "@/lib/db/prisma";
import { getChatbotTenant } from "@/lib/db/cache";
import {
  checkMultiTierRateLimits,
  createRateLimitResponse,
  acquireConcurrencySlot,
} from "@/lib/security/rate-limit";
import {
  isDomainAllowed,
  getCorsHeaders,
  handleCorsPreflight,
} from "@/lib/security/cors";
import { checkTenantQuota } from "@/lib/security/quota";

/** Handle CORS OPTIONS preflight */
export async function OPTIONS(req: Request) {
  return handleCorsPreflight(req);
}

/** Extract text from a UIMessage's parts array (AI SDK v6 format) */
function extractText(message: { role: string; content?: string; parts?: Array<{ type: string; text?: string }> }): string {
  if (message.parts && Array.isArray(message.parts)) {
    return message.parts
      .filter((p) => p.type === "text" && p.text)
      .map((p) => p.text)
      .join("");
  }
  return message.content || "";
}

const MAX_MESSAGES_COUNT = 50;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_TOTAL_CHARS = 32000;

export async function POST(req: Request) {
  let concurrencySlot: { acquired: boolean; release: () => void } | null = null;

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { chatbotId, messages, conversationId, visitorId, visitorName, visitorLocation, mode, language } = body;

    // ── 1. Input Validation & Request Size Limits ──
    if (!chatbotId || typeof chatbotId !== "string" || !messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid chatbotId or messages array" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array cannot be empty" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (messages.length > MAX_MESSAGES_COUNT) {
      return new Response(
        JSON.stringify({ error: `Message history exceeds limit of ${MAX_MESSAGES_COUNT} messages.` }),
        { status: 413, headers: { "Content-Type": "application/json" } }
      );
    }

    let totalChars = 0;
    for (const msg of messages) {
      const text = extractText(msg);
      if (text.length > MAX_MESSAGE_LENGTH) {
        return new Response(
          JSON.stringify({ error: `Individual message exceeds character limit of ${MAX_MESSAGE_LENGTH}.` }),
          { status: 413, headers: { "Content-Type": "application/json" } }
        );
      }
      totalChars += text.length;
    }

    if (totalChars > MAX_TOTAL_CHARS) {
      return new Response(
        JSON.stringify({ error: `Total conversation context exceeds limit of ${MAX_TOTAL_CHARS} characters.` }),
        { status: 413, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── 2. Multi-Tier Rate Limiting (Visitor + IP + Chatbot) ──
    const rateLimit = await checkMultiTierRateLimits(req, {
      endpoint: "chat",
      chatbotId,
      visitorId,
    });

    if (!rateLimit.success) {
      return createRateLimitResponse(rateLimit);
    }

    // ── 3. Chatbot Verification & Tenant Lookup ──
    const needsVisitor = !visitorId && (visitorName || visitorLocation);
    const [chatbot, visitor] = await Promise.all([
      getChatbotTenant(chatbotId),
      needsVisitor
        ? prisma.visitor.create({
            data: {
              name: visitorName || null,
              metadata: visitorLocation ? { location: visitorLocation } : undefined,
            },
          })
        : Promise.resolve(null),
    ]);

    if (!chatbot) {
      return new Response(
        JSON.stringify({ error: "Chatbot not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (chatbot.status !== "ACTIVE") {
      return new Response(
        JSON.stringify({ error: "Chatbot is currently inactive" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── 4. Allowed Domains & Strict CORS Validation ──
    const domainCheck = isDomainAllowed(req, chatbot.widgetConfig?.allowedDomains);
    if (!domainCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: domainCheck.reason || `Domain '${domainCheck.hostname || "unknown"}' is not authorized.`,
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            // Never grant CORS headers to unauthorized domains
          },
        }
      );
    }

    // ── 5. In-Flight Concurrency Limiting (Max 10 per chatbot) ──
    concurrencySlot = acquireConcurrencySlot(`chat:${chatbotId}`, 10);
    if (!concurrencySlot.acquired) {
      return new Response(
        JSON.stringify({
          error: "Too Many Requests",
          message: "Chatbot is processing maximum concurrent requests. Please wait a moment.",
        }),
        {
          status: 429,
          headers: {
            "Retry-After": "5",
            "Content-Type": "application/json",
            ...getCorsHeaders(domainCheck.origin),
          },
        }
      );
    }

    // ── 6. Cost Protection & Monthly Tenant Quota Check ──
    const quotaCheck = await checkTenantQuota(chatbot.tenantId);
    if (!quotaCheck.allowed) {
      concurrencySlot.release();
      return new Response(
        JSON.stringify({
          error: "Quota Exceeded",
          message: quotaCheck.reason,
        }),
        {
          status: quotaCheck.status || 402,
          headers: {
            "Content-Type": "application/json",
            ...getCorsHeaders(domainCheck.origin),
          },
        }
      );
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
              }).then((v) => {
                if (!v) return true;
                const firstSeen = new Date(v.firstSeenAt);
                firstSeen.setHours(0, 0, 0, 0);
                return firstSeen.getTime() === today.getTime();
              })
            : true;

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
    const corsHeaders = getCorsHeaders(domainCheck.origin);
    for (const [k, v] of Object.entries(corsHeaders)) {
      response.headers.set(k, v);
    }

    // Release concurrency slot
    concurrencySlot.release();

    return response;
  } catch (error) {
    if (concurrencySlot) {
      concurrencySlot.release();
    }

    console.error("[CHAT_API]", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
