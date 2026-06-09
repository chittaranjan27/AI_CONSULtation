import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const role = session.user.role;
    if (role !== "SUPER_ADMIN" && role !== "TENANT_OWNER") {
      return new NextResponse("Forbidden: Insufficient permissions", { status: 403 });
    }

    const keys = await prisma.tenantApiKey.findMany({
      where: { tenantId: session.user.tenantId },
      select: {
        id: true,
        provider: true,
        label: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
        // Mask the key
        encryptedKey: true,
      },
    });

    // Mask API keys for security
    const maskedKeys = keys.map((key) => ({
      ...key,
      encryptedKey: key.encryptedKey
        ? `${key.encryptedKey.slice(0, 8)}...${key.encryptedKey.slice(-4)}`
        : "",
    }));

    return NextResponse.json(maskedKeys);
  } catch (error) {
    console.error("[API_KEYS_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const role = session.user.role;
    if (role !== "SUPER_ADMIN" && role !== "TENANT_OWNER") {
      return new NextResponse("Forbidden: Insufficient permissions", { status: 403 });
    }

    const body = await req.json();
    const { provider, apiKey, label } = body;

    if (!provider || !apiKey) {
      return new NextResponse("Missing provider or apiKey", { status: 400 });
    }

    // Upsert the key (one per provider per tenant)
    const key = await prisma.tenantApiKey.upsert({
      where: {
        tenantId_provider: {
          tenantId: session.user.tenantId,
          provider,
        },
      },
      update: {
        encryptedKey: apiKey, // In production, encrypt this
        label: label || provider,
        isActive: true,
      },
      create: {
        tenantId: session.user.tenantId,
        provider,
        encryptedKey: apiKey,
        label: label || provider,
      },
    });

    return NextResponse.json({
      id: key.id,
      provider: key.provider,
      label: key.label,
      isActive: key.isActive,
    });
  } catch (error) {
    console.error("[API_KEYS_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const role = session.user.role;
    if (role !== "SUPER_ADMIN" && role !== "TENANT_OWNER") {
      return new NextResponse("Forbidden: Insufficient permissions", { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");

    if (!provider) {
      return new NextResponse("Missing provider parameter", { status: 400 });
    }

    await prisma.tenantApiKey.delete({
      where: {
        tenantId_provider: {
          tenantId: session.user.tenantId,
          provider: provider.toUpperCase() as any,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API_KEYS_DELETE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

