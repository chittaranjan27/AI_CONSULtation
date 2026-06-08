import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";
import { ConversationStatus } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: { createdAt: "desc" },
      take: 150,
      include: {
        visitor: true,
        chatbot: true,
        messages: {
          orderBy: { createdAt: "asc" },
        },
        usageRecords: true,
      },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("[CONVERSATIONS_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return new NextResponse("Missing conversation ID or status", { status: 400 });
    }

    // Validate ConversationStatus enum
    let convStatus: ConversationStatus;
    if (Object.values(ConversationStatus).includes(status.toUpperCase() as ConversationStatus)) {
      convStatus = status.toUpperCase() as ConversationStatus;
    } else {
      return new NextResponse("Invalid status value", { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.conversation.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existing) {
      return new NextResponse("Conversation not found", { status: 404 });
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: {
        status: convStatus,
        ...(convStatus === ConversationStatus.CLOSED ? { endedAt: new Date() } : {}),
      },
      include: {
        visitor: true,
        chatbot: true,
        messages: {
          orderBy: { createdAt: "asc" },
        },
        usageRecords: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[CONVERSATIONS_PATCH]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
