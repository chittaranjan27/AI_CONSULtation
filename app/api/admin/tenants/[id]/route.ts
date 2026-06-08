import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch tenant details
    const tenant = await prisma.tenant.findUnique({
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
          take: 10,
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Aggregate token and cost usage
    const usageAggregate = await prisma.usageRecord.aggregate({
      where: { tenantId: id },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        cost: true,
      },
    });

    // Fetch daily stats for charting
    const dailyStats = await prisma.dailyStats.findMany({
      where: { tenantId: id },
      orderBy: { date: "asc" },
      take: 30, // Last 30 records
    });

    // Format stats for chart
    const chartData = dailyStats.map((ds) => ({
      date: new Date(ds.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      conversations: ds.conversations,
      leads: ds.leadsCaptured,
      cost: ds.totalCost,
      tokens: ds.totalTokens,
    }));

    const isSuspended = tenant.users.every((u) => !u.isActive);

    const data = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      plan: tenant.plan,
      createdAt: tenant.createdAt,
      status: isSuspended ? "SUSPENDED" : "ACTIVE",
      users: tenant.users,
      chatbots: tenant.chatbots.map((bot) => ({
        id: bot.id,
        name: bot.name,
        status: bot.status,
        model: bot.model,
        provider: bot.aiProvider,
        conversations: bot._count.conversations,
        leads: bot._count.leads,
        createdAt: bot.createdAt,
      })),
      subscription: tenant.subscription,
      recentLeads: tenant.leads,
      usage: {
        inputTokens: usageAggregate._sum.inputTokens || 0,
        outputTokens: usageAggregate._sum.outputTokens || 0,
        totalTokens: usageAggregate._sum.totalTokens || 0,
        cost: usageAggregate._sum.cost || 0,
      },
      chartData,
      settings: tenant.settings,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching tenant detail:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, plan } = body; // action: "suspend" | "activate"

    if (action === "suspend") {
      // Deactivate all users in this tenant
      await prisma.user.updateMany({
        where: { tenantId: id },
        data: { isActive: false },
      });

      // Create Audit Log
      await prisma.auditLog.create({
        data: {
          tenantId: id,
          userId: session.user.id,
          action: "tenant.suspend",
          entity: "tenant",
          entityId: id,
          metadata: { suspendedBy: session.user.email },
        },
      });

      // Create Notification
      await prisma.systemNotification.create({
        data: {
          type: "tenant_suspended",
          title: "Tenant Suspended",
          message: `Tenant with ID ${id} was suspended by admin.`,
          metadata: { tenantId: id },
        },
      });

      return NextResponse.json({ success: true, message: "Tenant suspended" });
    }

    if (action === "activate") {
      // Activate all users in this tenant
      await prisma.user.updateMany({
        where: { tenantId: id },
        data: { isActive: true },
      });

      // Create Audit Log
      await prisma.auditLog.create({
        data: {
          tenantId: id,
          userId: session.user.id,
          action: "tenant.activate",
          entity: "tenant",
          entityId: id,
          metadata: { activatedBy: session.user.email },
        },
      });

      return NextResponse.json({ success: true, message: "Tenant activated" });
    }

    if (plan) {
      // Update tenant plan and subscription plan
      await prisma.$transaction([
        prisma.tenant.update({
          where: { id },
          data: { plan },
        }),
        prisma.subscription.updateMany({
          where: { tenantId: id },
          data: { plan },
        }),
        prisma.auditLog.create({
          data: {
            tenantId: id,
            userId: session.user.id,
            action: "tenant.plan_update",
            entity: "tenant",
            entityId: id,
            metadata: { newPlan: plan, updatedBy: session.user.email },
          },
        }),
      ]);

      return NextResponse.json({ success: true, message: `Tenant plan updated to ${plan}` });
    }

    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  } catch (error) {
    console.error("Error updating tenant:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run transaction
    await prisma.$transaction([
      prisma.auditLog.create({
        data: {
          tenantId: id,
          userId: session.user.id,
          action: "tenant.delete",
          entity: "tenant",
          entityId: id,
          metadata: { deletedBy: session.user.email },
        },
      }),
      // Delete tenant (Cascades automatically in schema due to onDelete: Cascade)
      prisma.tenant.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({ success: true, message: "Tenant deleted successfully" });
  } catch (error) {
    console.error("Error deleting tenant:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
