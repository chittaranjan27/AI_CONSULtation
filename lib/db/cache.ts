import prisma from "./prisma";

// Global cache object to persist across hot reloads in Next.js development mode
const globalCache = globalThis as unknown as {
  chatbotTenantCache: Map<string, { tenantId: string; status: string }> | undefined;
};

export const chatbotTenantCache = globalCache.chatbotTenantCache ?? new Map<string, { tenantId: string; status: string }>();

if (process.env.NODE_ENV !== "production") {
  globalCache.chatbotTenantCache = chatbotTenantCache;
}

/**
 * Resolve tenantId and status for a chatbotId using the in-memory cache if available.
 */
export async function getChatbotTenant(chatbotId: string): Promise<{ tenantId: string; status: string } | null> {
  if (!chatbotId) return null;

  const cached = chatbotTenantCache.get(chatbotId);
  if (cached) {
    return cached;
  }

  const chatbot = await prisma.chatbot.findUnique({
    where: { id: chatbotId },
    select: { tenantId: true, status: true },
  });

  if (!chatbot) return null;

  const data = { tenantId: chatbot.tenantId, status: chatbot.status };
  chatbotTenantCache.set(chatbotId, data);
  return data;
}

/**
 * Invalidate cache entry (e.g. when chatbot status or settings are updated).
 */
export function invalidateChatbotCache(chatbotId: string) {
  chatbotTenantCache.delete(chatbotId);
}
