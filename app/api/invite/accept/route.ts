import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production-abc123def456";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

// GET /api/invite/accept - Validate invitation token before showing registration page
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ valid: false, error: "Invitation token is required" }, { status: 400 });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        tenant: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ valid: false, error: "This invitation is invalid or has been revoked" }, { status: 400 });
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json({ valid: false, error: `This invitation has already been ${invitation.status.toLowerCase()}` }, { status: 400 });
    }

    if (invitation.expiresAt < new Date()) {
      // Mark as expired in DB
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ valid: false, error: "This invitation link has expired" }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      email: invitation.email,
      role: invitation.role,
      tenantName: invitation.tenant.name,
    });
  } catch (error) {
    console.error("Error validating invitation token:", error);
    return NextResponse.json({ valid: false, error: "Something went wrong" }, { status: 500 });
  }
}

// POST /api/invite/accept - Accept invitation, create user account, and log in
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, name, password } = body;

    if (!token || !name || !password) {
      return NextResponse.json({ error: "Required fields: token, name, password" }, { status: 400 });
    }

    // Lookup invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        tenant: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "This invitation is invalid or has been revoked" }, { status: 400 });
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json({ error: `This invitation has already been ${invitation.status.toLowerCase()}` }, { status: 400 });
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ error: "This invitation link has expired" }, { status: 400 });
    }

    // Clean email
    const emailNormalized = invitation.email.trim().toLowerCase();

    // Verify if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existingUser) {
      return NextResponse.json({ error: "A user with this email address is already registered" }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and update invitation inside a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      // 1. Create the user
      const user = await tx.user.create({
        data: {
          name,
          email: emailNormalized,
          password: hashedPassword,
          role: invitation.role,
          tenantId: invitation.tenantId,
          isActive: true,
        },
      });

      // 2. Mark invitation as accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      });

      // 3. Log to audit trail
      await tx.auditLog.create({
        data: {
          tenantId: invitation.tenantId,
          userId: user.id,
          action: "team.invitation.accept",
          entity: "user",
          entityId: user.id,
          metadata: {
            email: emailNormalized,
            role: invitation.role,
          },
        },
      });

      return user;
    });

    // Generate session token (same JWT flow as standard login)
    const sessionToken = jwt.sign(
      { userId: newUser.id },
      JWT_SECRET,
      { expiresIn: SESSION_MAX_AGE }
    );

    // Set cookie response
    const response = NextResponse.json({
      success: true,
      message: "Invitation accepted. Logging in...",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        tenantId: newUser.tenantId,
        tenantName: invitation.tenant.name,
      },
    });

    response.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("Error accepting team invitation:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
