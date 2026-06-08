import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";
import UsersListClient from "@/components/admin/UsersListClient";

export default async function AdminUsersPage() {
  // Enforce server-side session check
  const session = await auth();

  // Query users from database in server component
  const users = await prisma.user.findMany({
    include: {
      tenant: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

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

  return <UsersListClient initialUsers={formattedUsers} />;
}
