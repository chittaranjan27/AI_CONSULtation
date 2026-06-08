import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const systemTenant = await prisma.tenant.findUnique({
      where: { slug: "system-admin-tenant" },
    });

    if (!systemTenant) {
      return NextResponse.json({ error: "System tenant not found" }, { status: 404 });
    }

    // Default configuration if empty
    const defaultConfig = {
      branding: {
        platformName: "Brahma Graha",
        logoUrl: "",
        primaryColor: "#8b5cf6",
        secondaryColor: "#3b82f6",
      },
      aiProviders: {
        openaiActive: true,
        anthropicActive: true,
        geminiActive: true,
        sarvamActive: true,
      },
      emailTemplates: {
        welcomeSubject: "Welcome to Brahma Graha!",
        welcomeBody: "Hello {{name}},\n\nYour account has been set up successfully. Access your dashboard here: {{loginUrl}}",
        alertSubject: "Security Alert: Failed Login Attempts",
        alertBody: "We detected multiple failed login attempts on your account. If this wasn't you, please secure your profile immediately.",
      },
      notifications: {
        costSpikeThreshold: 50.0,
        tokenLimitThreshold: 90, // 90%
        syncFailureEmail: "alerts@brahmagraha.com",
      },
    };

    const config = systemTenant.settings ? { ...defaultConfig, ...(systemTenant.settings as any) } : defaultConfig;

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error fetching system settings:", error);
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

    const systemTenant = await prisma.tenant.findUnique({
      where: { slug: "system-admin-tenant" },
    });

    if (!systemTenant) {
      return NextResponse.json({ error: "System tenant not found" }, { status: 404 });
    }

    // Merge existing settings with new updates
    const currentSettings = (systemTenant.settings as any) || {};
    const updatedSettings = {
      ...currentSettings,
      ...body,
    };

    await prisma.tenant.update({
      where: { slug: "system-admin-tenant" },
      data: {
        settings: updatedSettings,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        tenantId: systemTenant.id,
        userId: session.user.id,
        action: "system.settings_update",
        entity: "tenant",
        entityId: systemTenant.id,
        metadata: { updatedBy: session.user.email },
      },
    });

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error) {
    console.error("Error updating system settings:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
