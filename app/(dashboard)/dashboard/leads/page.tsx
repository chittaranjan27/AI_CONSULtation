import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import LeadsList from "./LeadsList";

function formatTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default async function LeadsPage() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;

  // Calculate changes/trends comparing current 7 days vs previous 7 days
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Fetch all data in parallel to avoid sequential database query waterfall latencies
  const [
    dbLeads,
    dbChatbots,
    totalConversations,
    currentPeriodLeads,
    previousPeriodLeads,
    currentPeriodQualLeads,
    previousPeriodQualLeads,
    currentConversations,
    previousConversations,
    currentScoreAgg,
    previousScoreAgg,
  ] = await Promise.all([
    prisma.lead.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.chatbot.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.conversation.count({ where: { tenantId } }),
    prisma.lead.count({
      where: { tenantId, createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.lead.count({
      where: { tenantId, createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
    }),
    prisma.lead.count({
      where: { tenantId, status: "QUALIFIED", createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.lead.count({
      where: { tenantId, status: "QUALIFIED", createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
    }),
    prisma.conversation.count({
      where: { tenantId, createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.conversation.count({
      where: { tenantId, createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
    }),
    prisma.lead.aggregate({
      where: { tenantId, createdAt: { gte: sevenDaysAgo } },
      _avg: { score: true },
    }),
    prisma.lead.aggregate({
      where: { tenantId, createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
      _avg: { score: true },
    }),
  ]);

  const formattedLeads = dbLeads.map((lead) => ({
    id: lead.id,
    name: lead.name || "Unknown Lead",
    email: lead.email || "",
    phone: lead.phone || "",
    score: lead.score,
    status: lead.status,
    source: lead.source || "Manual",
    created: formatTimeAgo(lead.createdAt),
  }));

  // Calculate metrics
  const totalLeadsCount = dbLeads.length;
  const qualifiedLeadsCount = dbLeads.filter((l) => l.status === "QUALIFIED").length;

  const conversionRateVal = totalConversations > 0 ? (totalLeadsCount / totalConversations) * 100 : 0;

  const avgScoreVal = totalLeadsCount > 0
    ? Math.round(dbLeads.reduce((acc, lead) => acc + lead.score, 0) / totalLeadsCount)
    : 0;

  let leadChange = "+0%";
  if (previousPeriodLeads > 0) {
    const diff = Math.round(((currentPeriodLeads - previousPeriodLeads) / previousPeriodLeads) * 100);
    leadChange = `${diff >= 0 ? "+" : ""}${diff}%`;
  } else if (currentPeriodLeads > 0) {
    leadChange = "+100%";
  }

  let qualChange = "+0%";
  if (previousPeriodQualLeads > 0) {
    const diff = Math.round(((currentPeriodQualLeads - previousPeriodQualLeads) / previousPeriodQualLeads) * 100);
    qualChange = `${diff >= 0 ? "+" : ""}${diff}%`;
  } else if (currentPeriodQualLeads > 0) {
    qualChange = "+100%";
  }

  const currentConvVal = currentConversations > 0 ? (currentPeriodLeads / currentConversations) * 100 : 0;
  const previousConvVal = previousConversations > 0 ? (previousPeriodLeads / previousConversations) * 100 : 0;
  const rateDiff = currentConvVal - previousConvVal;
  const conversionRateChange = `${rateDiff >= 0 ? "+" : ""}${rateDiff.toFixed(1)}%`;

  const curScore = currentScoreAgg._avg.score || 0;
  const prevScore = previousScoreAgg._avg.score || 0;
  const scoreDiff = Math.round(curScore - prevScore);
  const scoreChange = `${scoreDiff >= 0 ? "+" : ""}${scoreDiff}`;

  const stats = [
    { label: "Total Leads", value: totalLeadsCount.toString(), change: leadChange },
    { label: "Qualified", value: qualifiedLeadsCount.toString(), change: qualChange },
    { label: "Conversion Rate", value: `${conversionRateVal.toFixed(1)}%`, change: conversionRateChange },
    { label: "Avg Score", value: avgScoreVal.toString(), change: scoreChange },
  ];

  return (
    <LeadsList
      initialLeads={formattedLeads}
      chatbots={dbChatbots}
      stats={stats}
    />
  );
}
