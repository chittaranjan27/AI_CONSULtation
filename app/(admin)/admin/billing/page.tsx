import prisma from "@/lib/db/prisma";
import { SubscriptionStatus } from "@prisma/client";
import BillingManagerClient from "@/components/admin/BillingManagerClient";

export default async function AdminBillingPage() {
  // Parallel query execution
  const [
    plans,
    tenants,
    activeSubscriptions,
    totalSubs,
    cancelledSubs,
    trialSubs,
    planGroups,
    recentInvoices,
  ] = await Promise.all([
    // Subscription Plan templates
    prisma.plan.findMany({
      orderBy: { priceMonthly: "asc" },
    }),
    // Tenants list for manual assignment
    prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        plan: true,
      },
      orderBy: { name: "asc" },
    }),
    // Active Subscriptions (for MRR calculation)
    prisma.subscription.findMany({
      where: { status: SubscriptionStatus.ACTIVE },
      select: { plan: true },
    }),
    // Total subscriptions
    prisma.subscription.count(),
    // Cancelled subscriptions for churn calculation
    prisma.subscription.count({
      where: { status: SubscriptionStatus.CANCELED },
    }),
    // Trial subscriptions
    prisma.subscription.count({
      where: { status: SubscriptionStatus.TRIALING },
    }),
    // Grouping for plan distribution chart
    prisma.tenant.groupBy({
      by: ["plan"],
      _count: { id: true },
    }),
    // Recent invoices
    prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        tenant: { select: { name: true } },
      },
    }),
  ]);

  // Convert/Format plans and tenants to plain JSON-compatible objects
  const plansJson = plans.map(p => ({
    id: p.id,
    name: p.name,
    planType: p.planType,
    priceMonthly: p.priceMonthly,
    priceYearly: p.priceYearly,
    chatbotLimit: p.chatbotLimit,
    teamMemberLimit: p.teamMemberLimit,
    tokenLimit: p.tokenLimit,
    leadLimit: p.leadLimit,
    features: p.features,
  }));

  const tenantsJson = tenants.map(t => ({
    id: t.id,
    name: t.name,
    plan: t.plan,
  }));

  const activeSubscriptionsJson = activeSubscriptions.map(s => ({
    plan: s.plan,
  }));

  const recentInvoicesJson = recentInvoices.map(inv => ({
    id: inv.id,
    stripeInvoiceId: inv.stripeInvoiceId,
    amount: inv.amount,
    currency: inv.currency,
    status: inv.status,
    createdAt: inv.createdAt.toISOString(),
    periodStart: inv.periodStart ? inv.periodStart.toISOString() : null,
    periodEnd: inv.periodEnd ? inv.periodEnd.toISOString() : null,
    tenant: inv.tenant ? { name: inv.tenant.name } : null,
  }));

  const planGroupsJson = planGroups.map(pg => ({
    plan: pg.plan,
    count: pg._count.id,
  }));

  return (
    <BillingManagerClient
      plans={plansJson}
      tenants={tenantsJson}
      activeSubscriptions={activeSubscriptionsJson}
      totalSubs={totalSubs}
      cancelledSubs={cancelledSubs}
      trialSubs={trialSubs}
      planGroups={planGroupsJson}
      recentInvoices={recentInvoicesJson}
    />
  );
}
