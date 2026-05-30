import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getChatbotTenant } from "@/lib/db/cache";
import { VOICE_COSTS } from "@/lib/ai/providers";

export async function POST(req: NextRequest) {
  const apiKey = process.env.SARVAM_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  try {
    const { text, speaker = "priya", language = "en", chatbotId, conversationId } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    const truncatedText = text.slice(0, 500);
    if (text.length > 500) {
      console.warn(`TTS text truncated: ${text.length} chars → 500 chars`);
    }

    const characterCount = truncatedText.length;

    // Use OpenAI TTS for Arabic/Urdu if OpenAI key is configured
    if ((language === "ar" || language === "ur") && openaiApiKey) {
      console.log(`Synthesizing ${language} voice via OpenAI TTS...`);
      // Use premium voices: alloy (balanced) or nova (higher pitch female)
      const openaiVoice = language === "ar" ? "alloy" : "nova";

      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          input: truncatedText,
          voice: openaiVoice,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI TTS error:", response.status, errorText);
        return NextResponse.json(
          { error: "OpenAI Speech synthesis failed", details: errorText },
          { status: response.status }
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64Audio = Buffer.from(arrayBuffer).toString("base64");

      // Log TTS usage (OpenAI) — fire-and-forget
      logTTSUsage(chatbotId, conversationId, "OPENAI", "tts-1", characterCount);

      return NextResponse.json({
        audio: base64Audio,
        format: "mp3",
      });
    }

    // Fallback to Sarvam for English/Hindi or any other supported Indic languages
    if (!apiKey) {
      return NextResponse.json(
        { error: "Sarvam API key not configured for language: " + language },
        { status: 500 }
      );
    }

    // Sarvam bulbul only supports English and 10 Indic languages (no Arabic, no Urdu for TTS)
    if (language === "ar" || language === "ur") {
      return NextResponse.json(
        { error: "Language " + language + " not supported by Sarvam TTS" },
        { status: 400 }
      );
    }

    const response = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "api-subscription-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: truncatedText,
        speaker,
        model: "bulbul:v3",
        speech_sample_rate: 24000,
        enable_preprocessing: false,
        pace: 1.0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Sarvam TTS error:", response.status, errorText);
      return NextResponse.json(
        { error: "Speech synthesis failed", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Log TTS usage (Sarvam AI) — fire-and-forget
    logTTSUsage(chatbotId, conversationId, "SARVAM", "bulbul:v3", characterCount);

    return NextResponse.json({
      audio: data.audios?.[0] || data.audio || "",
    });
  } catch (error) {
    console.error("Voice synthesize error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Log TTS usage to the database asynchronously (fire-and-forget).
 * Resolves tenantId from chatbotId and writes UsageRecord + DailyStats.
 */
async function logTTSUsage(
  chatbotId: string | null | undefined,
  conversationId: string | null | undefined,
  provider: "OPENAI" | "SARVAM",
  model: string,
  characterCount: number
) {
  if (!chatbotId) return;

  try {
    const chatbot = await getChatbotTenant(chatbotId);
    if (!chatbot) return;

    const tenantId = chatbot.tenantId;
    const costConfig = VOICE_COSTS[model];
    const estimatedCost = characterCount * (costConfig?.ratePerCharacter ?? 0);

    // Strip time from date for DailyStats date-only key
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Promise.all([
      prisma.usageRecord.create({
        data: {
          tenantId,
          chatbotId,
          conversationId: conversationId || null,
          provider,
          model,
          characterCount,
          requestType: "TTS",
          cost: estimatedCost,
        },
      }),
      prisma.dailyStats.upsert({
        where: {
          tenantId_chatbotId_date: {
            tenantId,
            chatbotId,
            date: today,
          },
        },
        create: {
          tenantId,
          chatbotId,
          date: today,
          ttsRequests: 1,
          ttsCharacters: characterCount,
          voiceCost: estimatedCost,
          totalCost: estimatedCost,
        },
        update: {
          ttsRequests: { increment: 1 },
          ttsCharacters: { increment: characterCount },
          voiceCost: { increment: estimatedCost },
          totalCost: { increment: estimatedCost },
        },
      }),
    ]);
  } catch (err) {
    console.error("Failed logging TTS usage:", err);
  }
}
