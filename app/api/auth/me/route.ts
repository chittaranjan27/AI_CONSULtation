import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile for client components.
 * Used by the dashboard layout to display real user name, email, and plan.
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      tenantId: session.user.tenantId,
      tenantName: session.user.tenantName,
      tenantSlug: session.user.tenantSlug,
      tenantPlan: session.user.tenantPlan,
    });
  } catch (error) {
    console.error("[AUTH_ME]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
