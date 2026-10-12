import prisma from "./prisma";
import { redisGet, redisSet, redisDel } from "@/lib/redis/client";

export interface ChatbotTenantInfo {
  tenantId: string;
  status: string;
  widgetConfig: any;
}

const CHATBOT_CACHE_TTL_SECONDS = 300; // 5 minutes

// Bounded local fallback cache (used only if Redis is unavailable)
const localFallbackMap = new Map<string, { data: ChatbotTenantInfo; expiresAt: number }>();

/**
 * Resolves tenantId, status, and widgetConfig for a chatbotId using shared Redis caching.
 * Falls back to bounded local memory if Redis is unavailable.
 */
export async function getChatbotTenant(chatbotId: string): Promise<ChatbotTenantInfo | null> {
  if (!chatbotId) return null;

  const cacheKey = `cache:chatbot:${chatbotId}`;

  // 1. Try Shared Redis Cache
  try {
    const cached = await redisGet<ChatbotTenantInfo>(cacheKey);
    if (cached) {
      return cached;
    }
  } catch {
    // Redis error handled gracefully below
  }

  // 2. Check Local Fallback (if Redis is down or warming up)
  const localHit = localFallbackMap.get(chatbotId);
  if (localHit && localHit.expiresAt > Date.now()) {
    return localHit.data;
  }

  // 3. Database Lookup
  const chatbot = await prisma.chatbot.findUnique({
    where: { id: chatbotId },
    select: { tenantId: true, status: true, widgetConfig: true },
  });

  if (!chatbot) return null;

  const data: ChatbotTenantInfo = {
    tenantId: chatbot.tenantId,
    status: chatbot.status,
    widgetConfig: chatbot.widgetConfig,
  };

  // 4. Save to Shared Redis Cache (asynchronous write)
  redisSet(cacheKey, data, CHATBOT_CACHE_TTL_SECONDS).catch(() => {});

  // Update short-lived local fallback (30s)
  localFallbackMap.set(chatbotId, {
    data,
    expiresAt: Date.now() + 30_000,
  });

  return data;
}

/**
 * Invalidate cache entry across all cluster nodes via Redis.
 * Called when chatbot status, widget config, or settings are updated.
 */
export async function invalidateChatbotCache(chatbotId: string): Promise<void> {
  if (!chatbotId) return;

  localFallbackMap.delete(chatbotId);
  const cacheKey = `cache:chatbot:${chatbotId}`;
  await redisDel(cacheKey);
}
