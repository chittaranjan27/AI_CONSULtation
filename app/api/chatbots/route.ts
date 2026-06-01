import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";
import { invalidateChatbotCache } from "@/lib/db/cache";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const chatbots = await prisma.chatbot.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(chatbots);
  } catch (error) {
    console.error("[CHATBOTS_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, description, systemPrompt, welcomeMessage, supportedLanguages } = body;

    if (!name) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Use the first selected language as the primary, default to "en"
    const langs: string[] = Array.isArray(supportedLanguages) && supportedLanguages.length > 0
      ? supportedLanguages
      : ["en"];
    const primaryLanguage = langs[0];

    // All chatbots start with an empty intake flow.
    // Users build their own custom steps via the dashboard editor.
    const chatbot = await prisma.chatbot.create({
      data: {
        tenantId: session.user.tenantId,
        name,
        description: description || "",
        systemPrompt: systemPrompt || "You are a helpful AI assistant.",
        welcomeMessage: welcomeMessage || "Hello! How can I help you today?",
        aiProvider: "OPENAI",
        model: "gpt-4o-mini",
        status: "ACTIVE",
        language: primaryLanguage,
        supportedLanguages: langs,
        consultationSteps: [],
      },
    });

    return NextResponse.json(chatbot);
  } catch (error) {
    console.error("[CHATBOTS_POST]", error);
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
      return new NextResponse("Missing chatbot ID", { status: 400 });
    }

    const chatbot = await prisma.chatbot.delete({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    });

    invalidateChatbotCache(id);

    return NextResponse.json(chatbot);
  } catch (error) {
    console.error("[CHATBOTS_DELETE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
