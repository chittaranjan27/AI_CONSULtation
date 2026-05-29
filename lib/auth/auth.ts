import { cookies } from "next/headers";

// ============================================
// MOCK AUTH — Replaces NextAuth
// Cookie-based session gate for admin access.
// ============================================

const MOCK_TENANT_ID = "cmpha2an80000f1p4n3z0rxhx";
const MOCK_TENANT_NAME = "nmc";
const MOCK_TENANT_SLUG = "nmc-mpha2an2";
const MOCK_TENANT_PLAN = "FREE";
const MOCK_USER_EMAIL = "kcd5567@gmail.com";
const MOCK_USER_NAME = "Admin";
const MOCK_USER_ROLE = "TENANT_OWNER";

export async function auth() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  if (!session || session.value !== "true") {
    return null;
  }

  return {
    user: {
      id: "mock-admin-user",
      email: MOCK_USER_EMAIL,
      name: MOCK_USER_NAME,
      image: undefined,
      role: MOCK_USER_ROLE as "SUPER_ADMIN" | "TENANT_OWNER" | "MANAGER" | "SUPPORT_AGENT" | "ANALYST",
      tenantId: MOCK_TENANT_ID,
      tenantName: MOCK_TENANT_NAME,
      tenantSlug: MOCK_TENANT_SLUG,
      tenantPlan: MOCK_TENANT_PLAN,
    },
  };
}

// Stub exports so any file importing these doesn't break
export const handlers = { GET: () => new Response("OK"), POST: () => new Response("OK") };
export const signIn = async () => {};
export const signOut = async () => {};
