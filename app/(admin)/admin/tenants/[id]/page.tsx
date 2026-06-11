import prisma from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import TenantDetailClient from "@/components/admin/TenantDetailClient";

export default async function AdminTenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Parallelize all three queries instead of running them sequentially
  const [tenant, usageAggregate, dailyStats] = await Promise.all([
    // Fetch tenant details with deep relations
    prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        chatbots: {
          include: {
            _count: {
              select: {
                conversations: true,
                leads: true,
              },
            },
          },
        },
        subscription: true,
        leads: {
          orderBy: { createdAt: "desc" },
          take: 15,
        },
      },
    }),
    // Aggregate token consumption and costs
    prisma.usageRecord.aggregate({
      where: { tenantId: id },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        cost: true,
      },
    }),
    // Fetch daily stats for graphing
    prisma.dailyStats.findMany({
      where: { tenantId: id },
      orderBy: { date: "asc" },
    }),
  ]);

  if (!tenant) {
    redirect("/admin/tenants");
  }

  // Roll up daily stats mapping for chart
  const dailyMap = new Map<string, { date: string; conversations: number; leads: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dailyMap.set(dateStr, {
      date: dateStr,
      conversations: 0,
      leads: 0,
    });
  }

  dailyStats.forEach((ds) => {
    const dateStr = new Date(ds.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const dayData = dailyMap.get(dateStr);
    if (dayData) {
      dayData.conversations += ds.conversations;
      dayData.leads += ds.leadsCaptured;
    }
  });

  const chartData = Array.from(dailyMap.values());
  const isSuspended = tenant.users.every((u) => !u.isActive);

  const tenantData = {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    domain: tenant.domain,
    plan: tenant.plan,
    createdAt: tenant.createdAt.toISOString(),
    status: isSuspended ? ("SUSPENDED" as const) : ("ACTIVE" as const),
    users: tenant.users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    })),
    chatbots: tenant.chatbots.map((bot) => ({
      id: bot.id,
      name: bot.name,
      status: bot.status,
      model: bot.model,
      provider: bot.aiProvider,
      conversations: bot._count.conversations,
      leads: bot._count.leads,
      createdAt: bot.createdAt.toISOString(),
    })),
    subscription: tenant.subscription
      ? {
          id: tenant.subscription.id,
          status: tenant.subscription.status,
          stripeSubscriptionId: tenant.subscription.stripeSubscriptionId,
          trialEndsAt: tenant.subscription.trialEndsAt
            ? tenant.subscription.trialEndsAt.toISOString()
            : null,
          currentPeriodStart: tenant.subscription.currentPeriodStart
            ? tenant.subscription.currentPeriodStart.toISOString()
            : null,
          currentPeriodEnd: tenant.subscription.currentPeriodEnd
            ? tenant.subscription.currentPeriodEnd.toISOString()
            : null,
        }
      : null,
    recentLeads: tenant.leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      score: lead.score,
      source: lead.source,
      createdAt: lead.createdAt.toISOString(),
    })),
    usage: {
      inputTokens: usageAggregate._sum.inputTokens || 0,
      outputTokens: usageAggregate._sum.outputTokens || 0,
      totalTokens: usageAggregate._sum.totalTokens || 0,
      cost: usageAggregate._sum.cost || 0,
    },
    chartData,
    settings: tenant.settings || null,
  };

  return <TenantDetailClient tenantData={tenantData} />;
}
