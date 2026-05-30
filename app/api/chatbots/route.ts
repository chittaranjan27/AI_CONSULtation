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

    const defaultConsultationSteps = [
      {
        stepNumber: 1,
        title: "Concern Selection",
        prompt: "Warmly welcome the user by name (if known). Use a professional, clinical, and empathetic tone appropriate for intimate wellness. Ask them what brings them here today. You MUST call the 'show_options' tool with these concern options: ['🌿 Intimate Itching & Irritation', '🌬️ Odor & Freshness Concerns', '🏃‍♂️ Sweat & Chafing (Active Lifestyle)', '✨ Daily Hygiene & pH Care', '❓ Something Else']. Do NOT answer other questions or offer products yet. After they select an option, call 'update_consultation_step' with stepNumber 2.",
        inputType: "options",
        options: [
          "🌿 Intimate Itching & Irritation",
          "🌬️ Odor & Freshness Concerns",
          "🏃‍♂️ Sweat & Chafing (Active Lifestyle)",
          "✨ Daily Hygiene & pH Care",
          "❓ Something Else"
        ]
      },
      {
        stepNumber: 2,
        title: "Single Follow-up Question",
        prompt: "Briefly acknowledge the concern they selected with empathy and clinical understanding (1 sentence max). Ask EXACTLY ONE relevant follow-up question to understand their lifestyle or duration of the issue.\n\nYou MUST call the 'show_options' tool to display the appropriate sub-options. Identify what the user selected in Step 1, and present the corresponding array of choices:\n\n- If selection was \"🌿 Intimate Itching & Irritation\":\n  Use options: ['Less than a week', '1-4 weeks', 'Over a month', 'Recurring issue']\n  \n- If selection was \"🌬️ Odor & Freshness Concerns\":\n  Use options: ['After workouts', 'Throughout the day', 'Mostly in hot weather', 'All the time']\n  \n- If selection was \"🏃‍♂️ Sweat & Chafing (Active Lifestyle)\":\n  Use options: ['During/After workouts', 'Throughout the work day', 'Mostly in hot weather']\n  \n- If selection was \"✨ Daily Hygiene & pH Care\":\n  Use options: ['Currently use body soap', 'Use nothing specific', 'Already use an intimate wash']\n  \n- If selection was \"❓ Something Else\":\n  Use options: ['General wellness routine', 'Product recommendations', 'Hygiene tips']\n  \nAfter they answer, call 'update_consultation_step' with stepNumber 3.",
        inputType: "options",
        options: []
      },
      {
        stepNumber: 3,
        title: "Clinical Explanation & Recommendation Offer",
        prompt: "Provide a short, plain-language clinical explanation (2-3 sentences) of WHY their selected concern happens (e.g., pH imbalance for itching/odor, skin friction for chafing, harsh soap disrupting microbiome for daily care). Do NOT ask another diagnostic question. Then ask if they would like to see a natural, pH-balanced wash designed specifically to address this. You MUST call the 'show_options' tool with options: ['✅ Yes, show me the solution', '🚫 No, thank you']. If they select 'Yes', call 'update_consultation_step' with stepNumber 4. If they select 'No', call 'update_consultation_step' with stepNumber 6.",
        inputType: "options",
        options: [
          "✅ Yes, show me the solution",
          "🚫 No, thank you"
        ]
      },
      {
        stepNumber: 4,
        title: "Product Display",
        prompt: "The user expressed interest. Call the 'fetch_products' tool to display the BrahmaGra product catalog on screen. In your text response, mention ONLY the product name and a very brief description/benefit (1 sentence). Let the product card display the remaining details, pricing, and specs. Avoid repeating pricing or long descriptions in your message. Say something like: \"I recommend the [Product Name], [Short Description] — check the product card below for all details.\" Keep your text to 1-2 sentences only and let the product card do the talking. You MUST call the 'show_options' tool with options: ['💳 I'd like to buy this', '📋 Tell me more about the ingredients', '🤔 I have other questions']. After they respond, call 'update_consultation_step' with stepNumber 5.",
        inputType: "options",
        options: [
          "💳 I'd like to buy this",
          "📋 Tell me more about the ingredients",
          "🤔 I have other questions"
        ]
      },
      {
        stepNumber: 5,
        title: "Product Benefits & Checkout Guidance",
        prompt: "Based on the user's response from Step 4: If they want to buy, guide them to use the 'Buy Now' button on the product card displayed above. If they asked about ingredients, do NOT write long ingredient lists or repeat product card details; briefly mention that the product has a pH-balanced formula (pH 5.5) with natural extracts (Tea Tree, Aloe Vera, Neem), and point them to the product card for the full list. If they had other questions, answer them very concisely using your knowledge base. Keep your response very brief and let the product card display the rest. You MUST call the 'show_options' tool with options: ['🛒 Proceed to checkout', '💬 I have another concern', '👋 That's all, thank you']. If they select 'another concern', call 'update_consultation_step' with stepNumber 1. If they select 'that's all', call 'update_consultation_step' with stepNumber 6.",
        inputType: "options",
        options: [
          "🛒 Proceed to checkout",
          "💬 I have another concern",
          "👋 That's all, thank you"
        ]
      },
      {
        stepNumber: 6,
        title: "Warp-up & Farewell",
        prompt: "Politely wrap up the conversation. Reassure them that intimate wellness is important and they made a great step by having this conversation. Let them know they can return anytime for more guidance. You MUST call the 'show_options' tool with options: ['🔄 Start a new consultation', '👋 End chat']. If they select 'Start a new consultation', call 'update_consultation_step' with stepNumber 1.",
        inputType: "options",
        options: [
          "🔄 Start a new consultation",
          "👋 End chat"
        ]
      }
    ];

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
        consultationSteps: defaultConsultationSteps,
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
