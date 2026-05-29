import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";
import { chunkText } from "@/lib/ai/chunker";
import { generateEmbeddings } from "@/lib/ai/embeddings";
import * as pdfParse from "pdf-parse";
import * as xlsx from "xlsx";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    let chatbotId = "";
    let content = "";
    let filename = "";
    let fileType = "txt";
    let fileSize = 0;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      chatbotId = (formData.get("chatbotId") as string) || "";

      if (!file || !chatbotId) {
        return new NextResponse("Missing file or chatbotId", { status: 400 });
      }

      filename = file.name;
      fileSize = file.size;

      const ext = filename.split(".").pop()?.toLowerCase() || "";
      const buffer = Buffer.from(await file.arrayBuffer());

      if (ext === "pdf" || file.type === "application/pdf") {
        fileType = "pdf";
        const parser = pdfParse as unknown as (data: Buffer) => Promise<{ text: string }>;
        const pdfData = await parser(buffer);
        content = pdfData.text || "";
      } else if (
        ext === "xlsx" ||
        ext === "xls" ||
        ext === "csv" ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "text/csv"
      ) {
        fileType = ext === "csv" ? "csv" : "xlsx";
        const workbook = xlsx.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        if (sheet) {
          const jsonData = xlsx.utils.sheet_to_json(sheet) as Record<string, unknown>[];
          if (jsonData.length > 0) {
            content = jsonData
              .map((row, i) => {
                const rowStr = Object.entries(row)
                  .map(([key, val]) => `${key}: ${val}`)
                  .join(", ");
                return `Row ${i + 1} - ${rowStr}`;
              })
              .join("\n");
          } else {
            content = "";
          }
        } else {
          content = "";
        }
      } else {
        fileType = ext || "txt";
        content = buffer.toString("utf-8");
      }
    } else {
      const body = await req.json();
      chatbotId = body.chatbotId;
      content = body.content;
      filename = body.filename || `upload-${Date.now()}.txt`;
      fileType = "txt";
      fileSize = new TextEncoder().encode(content).length;
    }

    if (!chatbotId || !content.trim()) {
      return new NextResponse("Missing chatbotId or empty content", { status: 400 });
    }

    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId, tenantId: session.user.tenantId },
    });

    if (!chatbot) {
      return new NextResponse("Chatbot not found", { status: 404 });
    }

    const apiKeyRecord = await prisma.tenantApiKey.findFirst({
      where: {
        tenantId: session.user.tenantId,
        provider: "OPENAI",
        isActive: true,
      },
    });

    if (!apiKeyRecord) {
      return NextResponse.json(
        { error: "An OpenAI API key is required for knowledge base embeddings. Please add one in Settings." },
        { status: 400 }
      );
    }

    const chunks = chunkText(content);

    if (chunks.length === 0) {
      return new NextResponse("No valid content to process", { status: 400 });
    }

    const chunkTexts = chunks.map((c) => c.content);
    const embeddings = await generateEmbeddings(chunkTexts, apiKeyRecord.encryptedKey);

    const document = await prisma.document.create({
      data: {
        tenantId: session.user.tenantId,
        chatbotId,
        filename,
        fileType,
        fileSize,
        status: "COMPLETED",
        chunkCount: chunks.length,
      },
    });

    await prisma.documentChunk.createMany({
      data: chunks.map((chunk, i) => ({
        documentId: document.id,
        chatbotId,
        content: chunk.content,
        embedding: embeddings[i],
        tokenCount: chunk.tokenCount,
        chunkIndex: chunk.chunkIndex,
      })),
    });

    return NextResponse.json({
      documentId: document.id,
      chunksCreated: chunks.length,
      filename: document.filename,
    });
  } catch (error) {
    console.error("[KNOWLEDGE_UPLOAD]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      { status: 500 }
    );
  }
}
