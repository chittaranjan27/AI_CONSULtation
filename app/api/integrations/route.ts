import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const integrations = await prisma.integration.findMany({
      where: { tenantId: session.user.tenantId },
    });

    return NextResponse.json(integrations);
  } catch (error) {
    console.error("[INTEGRATIONS_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { type, name, config, isActive } = body;

    if (!type || !name) {
      return new NextResponse("Missing integration type or name", { status: 400 });
    }

    const integration = await prisma.integration.upsert({
      where: {
        tenantId_type: {
          tenantId: session.user.tenantId,
          type,
        },
      },
      update: {
        name,
        config: config || {},
        isActive: isActive !== undefined ? isActive : true,
      },
      create: {
        tenantId: session.user.tenantId,
        type,
        name,
        config: config || {},
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(integration);
  } catch (error) {
    console.error("[INTEGRATIONS_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
