import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plans = await prisma.plan.findMany({
      orderBy: { priceMonthly: "asc" },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      planType,
      name,
      priceMonthly,
      priceYearly,
      chatbotLimit,
      teamMemberLimit,
      tokenLimit,
      leadLimit,
      features,
    } = body;

    if (!planType || !name) {
      return NextResponse.json({ error: "Plan Type and Name are required" }, { status: 400 });
    }

    const plan = await prisma.plan.upsert({
      where: { planType },
      update: {
        name,
        priceMonthly: parseFloat(priceMonthly),
        priceYearly: parseFloat(priceYearly),
        chatbotLimit: parseInt(chatbotLimit),
        teamMemberLimit: parseInt(teamMemberLimit),
        tokenLimit: parseInt(tokenLimit),
        leadLimit: parseInt(leadLimit),
        features: Array.isArray(features) ? features : features.split(",").map((f: string) => f.trim()),
      },
      create: {
        planType,
        name,
        priceMonthly: parseFloat(priceMonthly),
        priceYearly: parseFloat(priceYearly),
        chatbotLimit: parseInt(chatbotLimit),
        teamMemberLimit: parseInt(teamMemberLimit),
        tokenLimit: parseInt(tokenLimit),
        leadLimit: parseInt(leadLimit),
        features: Array.isArray(features) ? features : features.split(",").map((f: string) => f.trim()),
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId, // Super admin's own tenant
        userId: session.user.id,
        action: "plan.update",
        entity: "plan",
        entityId: plan.id,
        metadata: { planType, updatedBy: session.user.email },
      },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("Error updating plan:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tenantId, planType } = body;

    if (!tenantId || !planType) {
      return NextResponse.json({ error: "Tenant ID and Plan Type are required" }, { status: 400 });
    }

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Update plan in tenant and subscription
    const [updatedTenant] = await prisma.$transaction([
      prisma.tenant.update({
        where: { id: tenantId },
        data: { plan: planType },
      }),
      prisma.subscription.updateMany({
        where: { tenantId },
        data: { plan: planType },
      }),
      prisma.auditLog.create({
        data: {
          tenantId,
          userId: session.user.id,
          action: "tenant.subscription_change",
          entity: "tenant",
          entityId: tenantId,
          metadata: { oldPlan: tenant.plan, newPlan: planType, changedBy: session.user.email },
        },
      }),
    ]);

    return NextResponse.json({ success: true, tenant: updatedTenant });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
