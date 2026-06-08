import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const unreadCount = await prisma.systemNotification.count({
      where: { isRead: false },
    });

    return NextResponse.json({ count: unreadCount });
  } catch (error) {
    console.error("Error fetching unread notifications count:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
