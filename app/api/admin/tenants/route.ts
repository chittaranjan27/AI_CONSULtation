import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { generateSlug } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all tenants with relation counts
    const tenants = await prisma.tenant.findMany({
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            chatbots: true,
            leads: true,
          },
        },
        subscription: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Format output
    const formattedTenants = tenants.map((tenant) => {
      // Find the tenant owner
      const owner = tenant.users.find((u) => u.role === "TENANT_OWNER") || tenant.users[0];
      const isSuspended = tenant.users.every((u) => !u.isActive); // Tenant suspended means all users are deactivated

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        plan: tenant.plan,
        createdAt: tenant.createdAt,
        owner: owner
          ? {
              id: owner.id,
              name: owner.name,
              email: owner.email,
            }
          : null,
        chatbotsCount: tenant._count.chatbots,
        leadsCount: tenant._count.leads,
        status: isSuspended ? "SUSPENDED" : "ACTIVE",
        subscription: tenant.subscription,
      };
    });

    return NextResponse.json(formattedTenants);
  } catch (error) {
    console.error("Error fetching tenants:", error);
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
      companyName,
      ownerName,
      email,
      password,
      plan,
      allowedChatbots,
      allowedTeamMembers,
      tokenLimits,
      trialExpiration,
    } = body;

    if (!companyName || !ownerName || !email || !password || !plan) {
      return NextResponse.json(
        { error: "Required fields: Company Name, Owner Name, Email, Password, Plan" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email address already exists" },
        { status: 400 }
      );
    }

    // Generate unique slug
    let slug = generateSlug(companyName);
    const existingSlug = await prisma.tenant.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Run transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: companyName,
          slug,
          plan,
          settings: {
            defaultLanguage: "en",
            supportedLanguages: ["en"],
            allowedChatbots: allowedChatbots ? parseInt(allowedChatbots) : 5,
            allowedTeamMembers: allowedTeamMembers ? parseInt(allowedTeamMembers) : 5,
            tokenLimits: tokenLimits ? parseInt(tokenLimits) : 500000,
          },
        },
      });

      // 2. Create Owner User
      const owner = await tx.user.create({
        data: {
          email,
          name: ownerName,
          password: hashedPassword,
          role: "TENANT_OWNER",
          tenantId: tenant.id,
          isActive: true,
        },
      });

      // 3. Create Subscription
      const subStatus = trialExpiration ? "TRIALING" : "ACTIVE";
      const sub = await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          plan,
          status: subStatus,
          trialEndsAt: trialExpiration ? new Date(trialExpiration) : null,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      // 4. Create Audit Log
      await tx.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: session.user.id,
          action: "tenant.create",
          entity: "tenant",
          entityId: tenant.id,
          metadata: { createdByAdmin: session.user.email },
        },
      });

      // 5. Create System Notification
      await tx.systemNotification.create({
        data: {
          type: "new_tenant",
          title: "New Tenant Created",
          message: `Tenant "${companyName}" has been created with Owner "${ownerName}" on Plan "${plan}".`,
          metadata: { tenantId: tenant.id, slug: tenant.slug },
        },
      });

      return { tenant, owner, sub };
    });

    return NextResponse.json({
      success: true,
      tenantId: result.tenant.id,
      slug: result.tenant.slug,
    });
  } catch (error) {
    console.error("Error creating tenant:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
