import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production-abc123def456";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tenantId } = await req.json();
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID is required" }, { status: 400 });
    }

    // Find the user record matching the same email but in the target tenant
    const targetUser = await prisma.user.findFirst({
      where: {
        email: session.user.email,
        tenantId: tenantId,
        isActive: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Access to workspace denied" }, { status: 403 });
    }

    // Generate a new JWT token for the target user ID
    const newCookieToken = jwt.sign({ userId: targetUser.id }, JWT_SECRET, {
      expiresIn: "30d",
    });

    const response = NextResponse.json({ success: true, redirect: "/dashboard" });
    
    // Overwrite the session token cookie
    response.cookies.set("session_token", newCookieToken, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Clear any impersonation cookie when switching workspace
    response.cookies.delete("impersonated_tenant_id");

    return response;
  } catch (error) {
    console.error("Switch workspace error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
