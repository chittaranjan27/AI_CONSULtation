import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const rawChatbotId = searchParams.get("chatbotId");

    // Build the query filter without using 'any'
    const where: {
      tenantId: string;
      chatbotId?: string | null;
    } = {
      tenantId: session.user.tenantId,
    };

    if (rawChatbotId) {
      if (rawChatbotId === "null" || rawChatbotId === "undefined") {
        where.chatbotId = null;
      } else if (rawChatbotId !== "all") {
        where.chatbotId = rawChatbotId;
      }
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("[PRODUCTS_GET]", error);
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
    const { name, description, price, imageUrl, category, checkoutUrl, isActive, chatbotId } = body;

    if (!name || price === undefined) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Sanitize chatbotId to avoid foreign key errors on string "null"/"undefined"
    const sanitizedChatbotId = chatbotId === "null" || chatbotId === "undefined" || !chatbotId ? null : chatbotId;

    const product = await prisma.product.create({
      data: {
        tenantId: session.user.tenantId,
        name,
        description: description || null,
        price: parseFloat(price),
        currency: "aed",
        imageUrl: imageUrl || null,
        category: category || null,
        checkoutUrl: checkoutUrl || null,
        isActive: isActive !== undefined ? isActive : true,
        chatbotId: sanitizedChatbotId,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("[PRODUCTS_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
