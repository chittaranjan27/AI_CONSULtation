import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";
import SubscriptionManagerClient from "@/components/admin/SubscriptionManagerClient";

export default async function AdminSubscriptionsPage() {
  // Enforce server-side session check
  const session = await auth();

  // Query plans and tenants
  const [plans, tenants] = await Promise.all([
    prisma.plan.findMany({
      orderBy: { priceMonthly: "asc" },
    }),
    prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        plan: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return <SubscriptionManagerClient plans={plans} tenants={tenants} />;
}
