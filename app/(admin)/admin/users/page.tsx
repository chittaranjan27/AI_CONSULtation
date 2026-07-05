import prisma from "@/lib/db/prisma";
import UsersListClient from "@/components/admin/UsersListClient";
import { Suspense } from "react";

function UsersTableSkeleton() {
  return (
    <div className="glass-card p-5 h-96 bg-[var(--bg-elevated)]/20 animate-pulse border border-[var(--border-primary)] rounded-xl" />
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<UsersTableSkeleton />}>
      <UsersTableContent />
    </Suspense>
  );
}

async function UsersTableContent() {
  // Parallelize both queries and use select to fetch only display fields
  const [users, tenants] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        tenant: {
          select: { name: true, slug: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tenant.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Format the output structure
  const formattedUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
    tenant: {
      name: u.tenant.name,
      slug: u.tenant.slug,
    },
  }));

  return <UsersListClient initialUsers={formattedUsers} tenants={tenants} />;
}
