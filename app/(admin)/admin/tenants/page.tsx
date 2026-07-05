import prisma from "@/lib/db/prisma";
import TenantsListClient from "@/components/admin/TenantsListClient";
import { Suspense } from "react";

function TenantsTableSkeleton() {
  return (
    <div className="glass-card p-5 h-96 bg-[var(--bg-elevated)]/20 animate-pulse border border-[var(--border-primary)] rounded-xl" />
  );
}

export default function AdminTenantsPage() {
  return (
    <Suspense fallback={<TenantsTableSkeleton />}>
      <TenantsTableContent />
    </Suspense>
  );
}

async function TenantsTableContent() {
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
      subscription: { select: { status: true } },
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
