import prisma from "./prisma";

export interface ChatbotTenantInfo {
  tenantId: string;
  status: string;
  widgetConfig: any;
}

// Global cache object to persist across hot reloads in Next.js development mode
const globalCache = globalThis as unknown as {
  chatbotTenantCache: Map<string, ChatbotTenantInfo> | undefined;
};

export const chatbotTenantCache = globalCache.chatbotTenantCache ?? new Map<string, ChatbotTenantInfo>();

if (process.env.NODE_ENV !== "production") {
  globalCache.chatbotTenantCache = chatbotTenantCache;
}

/**
 * Resolve tenantId, status, and widgetConfig for a chatbotId using the cache if available.
 */
export async function getChatbotTenant(chatbotId: string): Promise<ChatbotTenantInfo | null> {
  if (!chatbotId) return null;

  const cached = chatbotTenantCache.get(chatbotId);
  if (cached) {
    return cached;
  }

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
  chatbotTenantCache.set(chatbotId, data);
  return data;
}

/**
 * Invalidate cache entry (e.g. when chatbot status or settings are updated).
 */
export function invalidateChatbotCache(chatbotId: string) {
  chatbotTenantCache.delete(chatbotId);
}
