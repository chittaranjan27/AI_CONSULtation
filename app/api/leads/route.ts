import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";
import { LeadStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, status, score, source, chatbotId } = body;

    let tenantId: string;

    if (chatbotId) {
      // Public widget submission: resolve tenantId from chatbotId
      const chatbot = await prisma.chatbot.findUnique({
        where: { id: chatbotId },
        select: { tenantId: true, status: true },
      });
      if (!chatbot) {
        return new NextResponse("Chatbot not found", { status: 404 });
      }
      if (chatbot.status !== "ACTIVE") {
        return new NextResponse("Chatbot is not active", { status: 403 });
      }
      tenantId = chatbot.tenantId;

      // Validate required fields for widget submissions (email and phone are required)
      if (!email || !phone) {
        return new NextResponse("Missing required fields (email, phone)", { status: 400 });
      }
    } else {
      // Authenticated dashboard submission
      const session = await auth();
      if (!session?.user?.tenantId) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
      tenantId = session.user.tenantId;

      // Validate required fields for manual dashboard entry (name and email are required)
      if (!name || !email) {
        return new NextResponse("Missing required fields (name, email)", { status: 400 });
      }
    }

    // Validate LeadStatus enum
    let leadStatus: LeadStatus = LeadStatus.NEW;
    if (status && Object.values(LeadStatus).includes(status as LeadStatus)) {
      leadStatus = status as LeadStatus;
    }

    const lead = await prisma.lead.create({
      data: {
        tenantId,
        name: name || "Widget Visitor",
        email,
        phone: phone || "",
        status: leadStatus,
        score: score ? parseInt(score) : 70,
        source: source || "Manual",
        chatbotId: chatbotId || null,
      },
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("[LEADS_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Missing lead ID", { status: 400 });
    }

    const lead = await prisma.lead.delete({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("[LEADS_DELETE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
