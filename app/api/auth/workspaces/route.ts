import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      where: { email: session.user.email, isActive: true },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
          },
        },
      },
    });

    const workspaces = users.map((u) => ({
      tenantId: u.tenant.id,
      name: u.tenant.name,
      slug: u.tenant.slug,
      plan: u.tenant.plan,
      role: u.role,
      isActiveWorkspace: u.tenantId === session.user.tenantId,
    }));

    return NextResponse.json(workspaces);
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
