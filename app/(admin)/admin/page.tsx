import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";
import { PlanType, SubscriptionStatus } from "@prisma/client";
import {
  Building,
  Users,
  Bot,
  MessageSquare,
  Target,
  PhoneCall,
  Zap,
  DollarSign,
  TrendingUp,
  Activity,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import AdminDashboardCharts from "@/components/admin/AdminDashboardCharts";

export default async function AdminDashboardPage() {
  // Enforce server-side session check
  const session = await auth();

  // Parallel database queries to prevent waterfall latencies
  const [
    totalTenants,
    totalUsers,
    totalChatbots,
    totalConversations,
    totalLeads,
    usageAggregate,
    subscriptions,
    planGroups,
    recentTenants,
    dailyStats,
    newTenantsRecent,
    notifications,
  ] = await Promise.all([
    // Total tenants
    prisma.tenant.count(),
    // Total users
    prisma.user.count(),
    // Total chatbots
    prisma.chatbot.count(),
    // Total conversations
    prisma.conversation.count(),
    // Total leads
    prisma.lead.count(),
    // AI cost aggregate
    prisma.usageRecord.aggregate({
      _sum: { cost: true, totalTokens: true },
    }),
    // Subscriptions for revenue calculation
    prisma.subscription.findMany({
      where: { status: "ACTIVE" },
    }),
    // Grouping for plan distribution
    prisma.tenant.groupBy({
      by: ["plan"],
      _count: { id: true },
    }),
    // Recent tenants signed up
    prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        users: {
          where: { role: "TENANT_OWNER" },
          select: { name: true, email: true },
        },
        _count: {
          select: { chatbots: true, leads: true },
        },
      },
    }),
    // Daily Stats for the last 30 days
    prisma.dailyStats.findMany({
      where: {
        date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { date: "asc" },
    }),
    // New tenants signed up in the last 30 days
    prisma.tenant.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      select: { createdAt: true },
    }),
    // System notifications for display
    prisma.systemNotification.findMany({
      where: { isRead: false },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  // Compute Tenant Status Segmentation
  // Suspended Tenants (all users in tenant deactivated)
  // Trial Tenants (subscriptions that are trialing)
  const trialTenantsCount = await prisma.subscription.count({
    where: { status: SubscriptionStatus.TRIALING },
  });

  const inactiveUsers = await prisma.user.findMany({
    select: { tenantId: true, isActive: true },
  });

  // Calculate suspended tenants (where all users in tenant are inactive)
  const tenantUserMap: Record<string, boolean[]> = {};
  inactiveUsers.forEach((u) => {
    if (!tenantUserMap[u.tenantId]) tenantUserMap[u.tenantId] = [];
    tenantUserMap[u.tenantId].push(u.isActive);
  });

  let suspendedTenantsCount = 0;
  Object.keys(tenantUserMap).forEach((tid) => {
    const statuses = tenantUserMap[tid];
    if (statuses.every((active) => !active)) {
      suspendedTenantsCount++;
    }
  });

  const activeTenantsCount = Math.max(0, totalTenants - suspendedTenantsCount);

  // Compute Voice Consultation Metrics from DailyStats
  const voiceConsultAggregate = await prisma.dailyStats.aggregate({
    _sum: { voiceConversations: true },
  });
  const totalVoiceConsultations = voiceConsultAggregate._sum.voiceConversations || 0;

  // Compute Total API Requests (LLM + Voice usages)
  const totalAPIRequests = await prisma.usageRecord.count();

  // Compute Monthly Revenue based on Active Subscription Plans
  const planPrices = {
    [PlanType.FREE]: 0,
    [PlanType.STARTER]: 29,
    [PlanType.PRO]: 79,
    [PlanType.ENTERPRISE]: 299,
  };

  let mrr = 0;
  subscriptions.forEach((sub) => {
    const price = planPrices[sub.plan] || 0;
    mrr += price;
  });

  // Compute Total AI Costs
  const totalAICost = usageAggregate._sum.cost || 0;

  // Map 30 days of historical data for charts
  const dailyMap = new Map<string, {
    date: string;
    conversations: number;
    leads: number;
    cost: number;
    signups: number;
    revenue: number;
  }>();

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dailyMap.set(dateStr, {
      date: dateStr,
      conversations: 0,
      leads: 0,
      cost: 0,
      signups: 0,
      revenue: parseFloat((mrr / 30).toFixed(2)), // Distributed daily average revenue
    });
  }

  dailyStats.forEach((ds) => {
    const dateStr = new Date(ds.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const dayData = dailyMap.get(dateStr);
    if (dayData) {
      dayData.conversations += ds.conversations;
      dayData.leads += ds.leadsCaptured;
      dayData.cost += ds.totalCost;
    }
  });

  newTenantsRecent.forEach((nt) => {
    const dateStr = new Date(nt.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const dayData = dailyMap.get(dateStr);
    if (dayData) {
      dayData.signups += 1;
    }
  });

  const growthData = Array.from(dailyMap.values());

  // Plan distribution chart data
  const planData = planGroups.map((pg) => ({
    name: pg.plan,
    value: pg._count.id,
  }));

  const statsCards = [
    { label: "Total Tenants", value: totalTenants, icon: Building, color: "blue" },
    { label: "Active Tenants", value: activeTenantsCount, icon: Activity, color: "emerald" },
    { label: "Trial Tenants", value: trialTenantsCount, icon: TrendingUp, color: "purple" },
    { label: "Suspended Tenants", value: suspendedTenantsCount, icon: AlertCircle, color: "pink" },
    { label: "Total Users", value: totalUsers, icon: Users, color: "cyan" },
    { label: "Total Chatbots", value: totalChatbots, icon: Bot, color: "purple" },
    { label: "Total Conversations", value: totalConversations, icon: MessageSquare, color: "blue" },
    { label: "Leads Generated", value: totalLeads, icon: Target, color: "emerald" },
    { label: "Voice Consultations", value: totalVoiceConsultations, icon: PhoneCall, color: "cyan" },
    { label: "Total API Requests", value: totalAPIRequests, icon: Zap, color: "amber" },
    { label: "Monthly Revenue (MRR)", value: `$${mrr.toLocaleString()}`, icon: DollarSign, color: "emerald" },
    { label: "Total AI Cost", value: `$${totalAICost.toFixed(2)}`, icon: DollarSign, color: "pink" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Super Admin Command Center</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Global view across all tenants, SaaS metrics, and system-wide performance logs.
          </p>
        </div>
      </div>

      {/* Warning/Notification Banner */}
      {notifications.length > 0 && (
        <div className="glass-card p-4 border-l-4 border-[var(--brand-purple)] hover:transform-none bg-[var(--brand-purple)]/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[var(--brand-purple)] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">Pending Platform Actions</h4>
            <div className="mt-1 space-y-1.5">
              {notifications.map((n) => (
                <p key={n.id} className="text-xs text-[var(--text-secondary)] truncate">
                  • <strong className="text-[var(--text-primary)]">{n.title}:</strong> {n.message}
                </p>
              ))}
            </div>
          </div>
          <Link
            href="/admin/notifications"
            className="text-xs text-[var(--brand-purple)] hover:text-purple-300 font-semibold flex items-center gap-1 shrink-0"
          >
            Manage Alerts <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="glass-card p-4 hover:transform-none flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-tertiary)] font-medium leading-none truncate pr-2">
                  {card.label}
                </span>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: `color-mix(in srgb, var(--brand-${card.color}) 10%, transparent)`,
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: `var(--brand-${card.color})` }} />
                </div>
              </div>
              <p className="text-xl font-extrabold text-[var(--text-primary)] mt-3 leading-none truncate">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts section */}
      <AdminDashboardCharts growthData={growthData} planData={planData} />

      {/* Recent Tenants Section */}
      <div className="glass-card p-5 hover:transform-none">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Recently Registered Tenants
          </h3>
          <Link
            href="/admin/tenants"
            className="text-xs text-[var(--brand-purple)] hover:text-purple-300 font-semibold"
          >
            Manage Tenants →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-primary)] text-[var(--text-tertiary)]">
                <th className="py-2.5 font-semibold">Company Name</th>
                <th className="py-2.5 font-semibold">Site Owner</th>
                <th className="py-2.5 font-semibold">Plan</th>
                <th className="py-2.5 font-semibold text-center">Chatbots</th>
                <th className="py-2.5 font-semibold text-center">Leads</th>
                <th className="py-2.5 font-semibold text-right">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {recentTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-[var(--text-muted)]">
                    No tenants found.
                  </td>
                </tr>
              ) : (
                recentTenants.map((t) => {
                  const owner = t.users[0] || { name: "No Owner Set", email: "N/A" };
                  return (
                    <tr key={t.id} className="text-[var(--text-secondary)] hover:text-white">
                      <td className="py-3 font-medium text-[var(--text-primary)]">
                        <Link href={`/admin/tenants/${t.id}`} className="hover:underline">
                          {t.name}
                        </Link>
                      </td>
                      <td className="py-3">
                        <div>
                          <p className="font-semibold text-xs text-text-primary">{owner.name}</p>
                          <p className="text-[11px] text-[var(--text-muted)]">{owner.email}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`badge text-[10px] uppercase font-bold ${
                            t.plan === "ENTERPRISE"
                              ? "badge-pink"
                              : t.plan === "PRO"
                              ? "badge-purple"
                              : t.plan === "STARTER"
                              ? "badge-blue"
                              : "badge-cyan"
                          }`}
                        >
                          {t.plan}
                        </span>
                      </td>
                      <td className="py-3 text-center font-bold">{t._count.chatbots}</td>
                      <td className="py-3 text-center font-bold text-[var(--brand-blue)]">
                        {t._count.leads}
                      </td>
                      <td className="py-3 text-right text-xs">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
