import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/db/prisma";
import { cache } from "react";

// ============================================
// REAL AUTH — JWT-based session with DB lookup
// Decodes the session_token cookie, looks up
// the real user + tenant from the database.
// ============================================

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production-abc123def456";

export const auth = cache(async () => {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("session_token");

  if (!tokenCookie || !tokenCookie.value) {
    return null;
  }

  try {
    // Verify and decode the JWT
    const decoded = jwt.verify(tokenCookie.value, JWT_SECRET) as { userId: string };

    if (!decoded?.userId) {
      return null;
    }

    // Look up only the fields we actually use from user + tenant
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isActive: true,
        tenantId: true,
        tenant: {
          select: { id: true, name: true, slug: true, plan: true },
        },
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    let tenantId = user.tenantId;
    let tenantName = user.tenant.name;
    let tenantSlug = user.tenant.slug;
    let tenantPlan = user.tenant.plan;
    let isImpersonating = false;

    if (user.role === "SUPER_ADMIN") {
      const impersonatedCookie = cookieStore.get("impersonated_tenant_id");
      if (impersonatedCookie && impersonatedCookie.value) {
        const targetTenant = await prisma.tenant.findUnique({
          where: { id: impersonatedCookie.value },
        });
        if (targetTenant) {
          tenantId = targetTenant.id;
          tenantName = targetTenant.name;
          tenantSlug = targetTenant.slug;
          tenantPlan = targetTenant.plan;
          isImpersonating = true;
        }
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || "User",
        image: user.avatar || undefined,
        role: user.role as "SUPER_ADMIN" | "TENANT_OWNER" | "MANAGER" | "SUPPORT_AGENT" | "ANALYST",
        tenantId,
        tenantName,
        tenantSlug,
        tenantPlan,
        isImpersonating,
      },
    };
  } catch {
    // JWT expired, invalid, or DB error — treat as unauthenticated
    return null;
  }
});

// Stub exports so any file importing these doesn't break
export const handlers = { GET: () => new Response("OK"), POST: () => new Response("OK") };
export const signIn = async () => {};
export const signOut = async () => {};
