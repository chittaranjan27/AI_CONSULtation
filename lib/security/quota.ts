import prisma from "@/lib/db/prisma";

// Ensure this utility is strictly server-only
if (typeof window !== "undefined") {
  throw new Error("Security alert: lib/security/quota cannot be bundled on the client.");
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  plan: string;
  totalTokensUsed: number;
  tokenLimit: number;
  status: number; // HTTP status code (402 or 403 or 200)
}

// Plan limits for monthly token usage
export const PLAN_TOKEN_LIMITS: Record<string, number> = {
  FREE: 100_000,
  STARTER: 1_000_000,
  PRO: 5_000_000,
  ENTERPRISE: 50_000_000,
};

// 60-second in-memory cache to prevent hitting the database on every single streaming token
interface QuotaCacheEntry {
  result: QuotaCheckResult;
  expiresAt: number;
}

const quotaCache = new Map<string, QuotaCacheEntry>();

/**
 * Checks whether the tenant has exceeded their monthly quota or has an invalid subscription status.
 * Evaluated BEFORE invoking any expensive AI or Voice provider API.
 */
export async function checkTenantQuota(tenantId: string): Promise<QuotaCheckResult> {
  const now = Date.now();
  const cached = quotaCache.get(tenantId);
  if (cached && cached.expiresAt > now) {
    return cached.result;
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        plan: true,
        subscription: {
          select: {
            status: true,
            currentPeriodStart: true,
          },
        },
      },
    });

    if (!tenant) {
      return {
        allowed: false,
        reason: "Tenant not found or inactive.",
        plan: "UNKNOWN",
        totalTokensUsed: 0,
        tokenLimit: 0,
        status: 404,
      };
    }

    // 1. Subscription Status Check
    const subStatus = tenant.subscription?.status;
    if (subStatus === "CANCELED" || subStatus === "PAST_DUE") {
      const result: QuotaCheckResult = {
        allowed: false,
        reason: `Subscription is ${subStatus}. Please update your billing details in Settings.`,
        plan: tenant.plan,
        totalTokensUsed: 0,
        tokenLimit: 0,
        status: 402, // Payment Required
      };
      quotaCache.set(tenantId, { result, expiresAt: now + 30_000 });
      return result;
    }

    // 2. Monthly Usage Calculation
    const planName = tenant.plan || "FREE";
    const tokenLimit = PLAN_TOKEN_LIMITS[planName] || PLAN_TOKEN_LIMITS.FREE;

    // Determine current month window
    const startOfMonth = tenant.subscription?.currentPeriodStart
      ? new Date(tenant.subscription.currentPeriodStart)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // Sum token usage from UsageRecord
    const usageAggregate = await prisma.usageRecord.aggregate({
      where: {
        tenantId,
        createdAt: { gte: startOfMonth },
      },
      _sum: {
        totalTokens: true,
      },
    });

    const totalTokensUsed = usageAggregate._sum.totalTokens || 0;

    if (totalTokensUsed >= tokenLimit) {
      const result: QuotaCheckResult = {
        allowed: false,
        reason: `Monthly AI token quota exhausted (${totalTokensUsed.toLocaleString()} / ${tokenLimit.toLocaleString()} tokens used on ${planName} plan). Upgrade your plan to continue.`,
        plan: planName,
        totalTokensUsed,
        tokenLimit,
        status: 402, // Payment Required
      };
      // Cache quota exhaustion for 60s
      quotaCache.set(tenantId, { result, expiresAt: now + 60_000 });
      return result;
    }

    const result: QuotaCheckResult = {
      allowed: true,
      plan: planName,
      totalTokensUsed,
      tokenLimit,
      status: 200,
    };

    // Cache successful quota check for 60 seconds
    quotaCache.set(tenantId, { result, expiresAt: now + 60_000 });
    return result;
  } catch (error) {
    console.error("[SECURITY] Error checking tenant quota:", error);
    // Fail-open for transient DB errors so normal users aren't locked out, but log alert
    return {
      allowed: true,
      plan: "FALLBACK",
      totalTokensUsed: 0,
      tokenLimit: Infinity,
      status: 200,
    };
  }
}

/**
 * Invalidates cached quota for a tenant (called when billing updates or plan changes).
 */
export function invalidateTenantQuotaCache(tenantId: string): void {
  quotaCache.delete(tenantId);
}
