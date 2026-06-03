import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";
import { getChatbotTenant } from "@/lib/db/cache";
import { LeadStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, location, status, score, source, chatbotId } = body;

    let tenantId: string;

    if (chatbotId) {
      // Public widget submission: resolve tenantId from chatbotId
      const chatbot = await getChatbotTenant(chatbotId);
      if (!chatbot) {
        return new NextResponse("Chatbot not found", { status: 404 });
      }
      if (chatbot.status !== "ACTIVE") {
        return new NextResponse("Chatbot is not active", { status: 403 });
      }
      tenantId = chatbot.tenantId;

      // Validate required fields for widget submissions (name and location are required)
      if (!name || !location) {
        return new NextResponse("Missing required fields (name, location)", { status: 400 });
      }
    } else {
      // Authenticated dashboard submission
      const session = await auth();
      if (!session?.user?.tenantId) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
      tenantId = session.user.tenantId;

      // Validate required fields for manual dashboard entry (name and location are required)
      if (!name || !location) {
        return new NextResponse("Missing required fields (name, location)", { status: 400 });
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
        email: null,
        phone: phone || "",
        status: leadStatus,
        score: score ? parseInt(score) : 70,
        source: source || "Manual",
        chatbotId: chatbotId || null,
        metadata: location ? { location } : undefined,
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
