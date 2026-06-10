import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        tenantId: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        emailVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching admin users:", error);
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
    const { name, email, password, role, tenantId } = body;

    if (!email || !password || !role || !tenantId) {
      return NextResponse.json(
        { error: "Required fields: Email, Password, Role, Tenant ID" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email address already exists" },
        { status: 400 }
      );
    }

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Selected workspace tenant does not exist" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        tenantId,
        isActive: true,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: session.user.id,
        action: "user.create",
        entity: "user",
        entityId: user.id,
        metadata: { createdByAdmin: session.user.email, email, role },
      },
    });

    // Mock invitation email logging
    console.log(`[MOCK EMAIL SERVICE] Sending credential email to ${email}. Workspace: ${tenant.name}. Role: ${role}. Temp Password: ${password}`);

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

