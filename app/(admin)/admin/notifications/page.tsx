import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";
import NotificationsCenterClient from "@/components/admin/NotificationsCenterClient";

export default async function AdminNotificationsPage() {
  // Enforce server-side session check
  const session = await auth();

  // Query notifications from database
  const notifications = await prisma.systemNotification.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Format notifications for client component serialization
  const formattedNotifications = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    metadata: n.metadata || null,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  }));

  return <NotificationsCenterClient initialNotifications={formattedNotifications} />;
}
