import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/db/prisma";

// ============================================
// REAL AUTH — JWT-based session with DB lookup
// Decodes the session_token cookie, looks up
// the real user + tenant from the database.
// ============================================

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production-abc123def456";

export async function auth() {
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

    // Look up the real user + tenant from the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { tenant: true },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || "User",
        image: user.avatar || undefined,
        role: user.role as "SUPER_ADMIN" | "TENANT_OWNER" | "MANAGER" | "SUPPORT_AGENT" | "ANALYST",
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
        tenantSlug: user.tenant.slug,
        tenantPlan: user.tenant.plan,
      },
    };
  } catch {
    // JWT expired, invalid, or DB error — treat as unauthenticated
    return null;
  }
}

// Stub exports so any file importing these doesn't break
export const handlers = { GET: () => new Response("OK"), POST: () => new Response("OK") };
export const signIn = async () => {};
export const signOut = async () => {};
