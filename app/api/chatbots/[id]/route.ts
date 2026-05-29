import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const chatbot = await prisma.chatbot.findUnique({
      where: { id, tenantId: session.user.tenantId },
      include: {
        documents: {
          select: {
            id: true,
            filename: true,
            fileType: true,
            fileSize: true,
            status: true,
            chunkCount: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            conversations: true,
            leads: true,
          },
        },
      },
    });

    if (!chatbot) {
      return new NextResponse("Chatbot not found", { status: 404 });
    }

    return NextResponse.json(chatbot);
  } catch (error) {
    console.error("[CHATBOT_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Verify ownership
    const existing = await prisma.chatbot.findUnique({
      where: { id, tenantId: session.user.tenantId },
    });

    if (!existing) {
      return new NextResponse("Chatbot not found", { status: 404 });
    }

    // Allowed update fields
    const {
      name,
      description,
      systemPrompt,
      welcomeMessage,
      aiProvider,
      model,
      temperature,
      maxTokens,
      status,
      language,
      supportedLanguages,
      widgetMode,
      widgetPosition,
      widgetConfig,
      leadCaptureEnabled,
      leadCaptureFields,
      personality,
      consultationSteps,
    } = body;

    const chatbot = await prisma.chatbot.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(systemPrompt !== undefined && { systemPrompt }),
        ...(welcomeMessage !== undefined && { welcomeMessage }),
        ...(aiProvider !== undefined && { aiProvider }),
        ...(model !== undefined && { model }),
        ...(temperature !== undefined && { temperature: parseFloat(temperature) }),
        ...(maxTokens !== undefined && { maxTokens: parseInt(maxTokens) }),
        ...(status !== undefined && { status }),
        ...(language !== undefined && { language }),
        ...(supportedLanguages !== undefined && { supportedLanguages }),
        ...(widgetMode !== undefined && { widgetMode }),
        ...(widgetPosition !== undefined && { widgetPosition }),
        ...(widgetConfig !== undefined && { widgetConfig }),
        ...(leadCaptureEnabled !== undefined && { leadCaptureEnabled }),
        ...(leadCaptureFields !== undefined && { leadCaptureFields }),
        ...(personality !== undefined && { personality }),
        ...(consultationSteps !== undefined && { consultationSteps }),
      },
    });

    return NextResponse.json(chatbot);
  } catch (error) {
    console.error("[CHATBOT_PATCH]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const chatbot = await prisma.chatbot.delete({
      where: { id, tenantId: session.user.tenantId },
    });

    return NextResponse.json(chatbot);
  } catch (error) {
    console.error("[CHATBOT_DELETE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
