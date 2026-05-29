import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        logo: true,
        plan: true,
        branding: true,
        settings: true,
      },
    });

    if (!tenant) {
      return new NextResponse("Tenant not found", { status: 404 });
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error("[TENANT_SETTINGS_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, logo, branding, settings } = body;

    const updatedTenant = await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: {
        ...(name && { name }),
        ...(logo !== undefined && { logo }),
        ...(branding !== undefined && { branding }),
        ...(settings !== undefined && { settings }),
      },
    });

    return NextResponse.json(updatedTenant);
  } catch (error) {
    console.error("[TENANT_SETTINGS_PATCH]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
