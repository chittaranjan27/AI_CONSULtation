import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";
import TenantsListClient from "@/components/admin/TenantsListClient";

export default async function AdminTenantsPage() {
  // Enforce server-side session check
  const session = await auth();

  // Query tenants from database in server component
  const tenants = await prisma.tenant.findMany({
    include: {
      users: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      },
      _count: {
        select: {
          chatbots: true,
          leads: true,
        },
      },
      subscription: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Format the output structure
  const formattedTenants = tenants.map((tenant) => {
    const owner = tenant.users.find((u) => u.role === "TENANT_OWNER") || tenant.users[0];
    const isSuspended = tenant.users.every((u) => !u.isActive);

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      plan: tenant.plan,
      createdAt: tenant.createdAt.toISOString(),
      owner: owner
        ? {
            id: owner.id,
            name: owner.name || "Unnamed",
            email: owner.email,
          }
        : null,
      chatbotsCount: tenant._count.chatbots,
      leadsCount: tenant._count.leads,
      status: isSuspended ? ("SUSPENDED" as const) : ("ACTIVE" as const),
    };
  });

  return <TenantsListClient initialTenants={formattedTenants} />;
}
