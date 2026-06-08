import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Redirect if not logged in
  if (!session?.user) {
    redirect("/login");
  }

  // Redirect if not a Super Admin
  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <AdminLayoutClient user={session.user}>
      {children}
    </AdminLayoutClient>
  );
}
