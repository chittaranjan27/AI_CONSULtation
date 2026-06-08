import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";
import { retrieveContext } from "@/lib/ai/rag";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatbotId, query, limit, similarity } = await req.json();
    if (!chatbotId || !query) {
      return NextResponse.json({ error: "Chatbot ID and query are required" }, { status: 400 });
    }

    // Verify chatbot belongs to this tenant
    const chatbot = await prisma.chatbot.findFirst({
      where: { id: chatbotId, tenantId: session.user.tenantId },
    });

    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }

    // Retrieve the tenant's OpenAI API key for embeddings
    const openaiKey = await prisma.tenantApiKey.findFirst({
      where: { tenantId: session.user.tenantId, provider: "OPENAI", isActive: true },
    });

    // Default to environment key if tenant hasn't set their own
    const embeddingApiKey = openaiKey?.encryptedKey || process.env.OPENAI_API_KEY;

    if (!embeddingApiKey) {
      return NextResponse.json(
        { error: "OpenAI API Key is required. Please set one up in Settings or AI Config first." },
        { status: 400 }
      );
    }

    const topK = limit ? parseInt(limit) : 5;
    const minSimilarity = similarity ? parseFloat(similarity) : 0.3;

    const context = await retrieveContext(chatbotId, query, embeddingApiKey, topK, minSimilarity);

    return NextResponse.json({
      success: true,
      chunks: context.chunks,
    });
  } catch (error) {
    console.error("Vector search debugger error:", error);
    return NextResponse.json({ error: "Vector search failed" }, { status: 500 });
  }
}
