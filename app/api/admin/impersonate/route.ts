import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/db/prisma";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production-abc123def456";

export async function POST(req: NextRequest) {
  try {
    const tokenCookie = req.cookies.get("session_token");
    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(tokenCookie.value, JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tenantId } = await req.json();
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID is required" }, { status: 400 });
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const response = NextResponse.json({ success: true, redirect: "/dashboard" });
    
    // Set the cookie
    response.cookies.set("impersonated_tenant_id", tenantId, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 2, // 2 hours
    });

    return response;
  } catch (error) {
    console.error("Impersonate error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const response = NextResponse.json({ success: true, redirect: "/admin/tenants" });
    response.cookies.delete("impersonated_tenant_id");
    return response;
  } catch (error) {
    console.error("Stop impersonation error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
