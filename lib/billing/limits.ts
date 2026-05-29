import { PlanType } from "@prisma/client";

export interface PlanConfig {
  name: string;
  tokenLimit: number;
  chatbotLimit: number;
  documentLimit: number;
  costPerExtraThousand: number;
}

export const PLAN_LIMITS: Record<PlanType, PlanConfig> = {
  FREE: {
    name: "Free Plan",
    tokenLimit: 100_000, // 100K tokens (~75,000 words)
    chatbotLimit: 1,
    documentLimit: 5,
    costPerExtraThousand: 0,
  },
  STARTER: {
    name: "Starter Plan",
    tokenLimit: 2_000_000, // 2M tokens
    chatbotLimit: 3,
    documentLimit: 20,
    costPerExtraThousand: 0.002,
  },
  PRO: {
    name: "Pro Plan",
    tokenLimit: 10_000_000, // 10M tokens
    chatbotLimit: 10,
    documentLimit: 100,
    costPerExtraThousand: 0.0015,
  },
  ENTERPRISE: {
    name: "Enterprise Plan",
    tokenLimit: 100_000_000, // 100M tokens
    chatbotLimit: 50,
    documentLimit: 1000,
    costPerExtraThousand: 0.001,
  },
};

export function getPlanConfig(plan: PlanType): PlanConfig {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
}
