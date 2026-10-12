import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getChatbotTenant } from "@/lib/db/cache";
import { getSystemPricingRates, calculateVoiceCost } from "@/lib/ai/providers";
import {
  checkMultiTierRateLimits,
  createRateLimitResponse,
  acquireConcurrencySlot,
} from "@/lib/security/rate-limit";
import {
  isDomainAllowed,
  getCorsHeaders,
  handleCorsPreflight,
} from "@/lib/security/cors";
import { checkTenantQuota } from "@/lib/security/quota";

/** Handle CORS OPTIONS preflight */
export async function OPTIONS(req: Request) {
  return handleCorsPreflight(req);
}

// Language code mapping: short code → BCP-47 locale for Sarvam AI
const LANGUAGE_MAP: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  ur: "ur-IN",
  ar: "ar-AE",
  bn: "bn-IN",
  te: "te-IN",
  ta: "ta-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
  od: "od-IN",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
};

export async function POST(req: NextRequest) {
  let concurrencySlot: { acquired: boolean; release: () => void } | null = null;
  const apiKey = process.env.SARVAM_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const language = (formData.get("language") as string) || "en";
    const chatbotId = (formData.get("chatbotId") as string) || null;
    const conversationId = (formData.get("conversationId") as string) || null;
    const duration = parseFloat((formData.get("duration") as string) || "0") || 0;

    // ── 1. Multi-Tier Rate Limiting Check (Visitor + IP + Chatbot) ──
    const rateLimit = await checkMultiTierRateLimits(req, {
      endpoint: "voice_stt",
      chatbotId,
    });
    if (!rateLimit.success) {
      return createRateLimitResponse(rateLimit);
    }

    // ── 2. Chatbot Verification & Allowed Domains Check ──
    if (chatbotId) {
      const chatbot = await getChatbotTenant(chatbotId);
      if (chatbot) {
        if (chatbot.status !== "ACTIVE") {
          return NextResponse.json({ error: "Chatbot is inactive" }, { status: 403 });
        }

        const domainCheck = isDomainAllowed(req, chatbot.widgetConfig?.allowedDomains);
        if (!domainCheck.allowed) {
          return NextResponse.json(
            { error: domainCheck.reason || `Domain '${domainCheck.hostname || "unknown"}' is not authorized.` },
            { status: 403 }
          );
        }

        // ── 3. Tenant Quota Check ──
        const quota = await checkTenantQuota(chatbot.tenantId);
        if (!quota.allowed) {
          return NextResponse.json(
            { error: "Quota Exceeded", message: quota.reason },
            { status: quota.status || 402, headers: getCorsHeaders(domainCheck.origin) }
          );
        }
      }
    }

    // ── 4. Concurrency Protection (Max 5 parallel STT calls) ──
    concurrencySlot = acquireConcurrencySlot(`stt:${chatbotId || "global"}`, 5);
    if (!concurrencySlot.acquired) {
      return NextResponse.json(
        { error: "Voice transcription service is currently busy. Please retry shortly." },
        { status: 429, headers: { "Retry-After": "3" } }
      );
    }

    // ── 5. Input Validation & Request Size Limits ──
    if (!audioFile) {
      concurrencySlot.release();
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400, headers: getCorsHeaders(req.headers.get("origin")) }
      );
    }

    // Max 10MB audio file
    if (audioFile.size > 10 * 1024 * 1024) {
      concurrencySlot.release();
      return NextResponse.json(
        { error: "Audio file exceeds maximum size limit of 10MB" },
        { status: 413, headers: getCorsHeaders(req.headers.get("origin")) }
      );
    }

    const filename = audioFile.name || "recording.wav";

    // Fallback to OpenAI Whisper for Arabic transcription if API key is present
    if (language === "ar" && openaiApiKey) {
      console.log(`Transcribing Arabic via OpenAI Whisper: file=${filename}, size=${audioFile.size} bytes`);
      const whisperForm = new FormData();
      whisperForm.append("file", audioFile, filename);
      whisperForm.append("model", "whisper-1");
      whisperForm.append("language", "ar");

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: whisperForm,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI Whisper STT error:", response.status, errorText);
        return NextResponse.json(
          { error: "Whisper transcription failed", details: errorText },
          { status: response.status }
        );
      }

      const data = await response.json();

      // Prepare response FIRST, then log (truly non-blocking)
      const jsonResponse = NextResponse.json({
        transcript: data.text || "",
      });

      // Log STT usage (OpenAI Whisper) — fire-and-forget after response is ready
      logSTTUsage(chatbotId, conversationId, "OPENAI", "whisper-1", duration);

      return jsonResponse;
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "Sarvam API key not configured" },
        { status: 500 }
      );
    }

    // Build the Sarvam API request as multipart/form-data
    const sarvamForm = new FormData();
    console.log(`Sarvam STT request: file=${filename}, type=${audioFile.type}, size=${audioFile.size} bytes, language=${language}`);

    sarvamForm.append("file", audioFile, filename);
    sarvamForm.append("model", "saaras:v3");
    sarvamForm.append("language_code", LANGUAGE_MAP[language] || "en-IN");

    const response = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: {
        "api-subscription-key": apiKey,
      },
      body: sarvamForm,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Sarvam STT error:", response.status, errorText);
      return NextResponse.json(
        { error: "Transcription failed", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Prepare response FIRST, then log (truly non-blocking)
    const jsonResponse = NextResponse.json({
      transcript: data.transcript || data.text || "",
    });

    // Log STT usage (Sarvam AI) — fire-and-forget after response is ready
    logSTTUsage(chatbotId, conversationId, "SARVAM", "saaras:v3", duration);

    return jsonResponse;
  } catch (error) {
    console.error("Voice transcribe error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    if (concurrencySlot) {
      concurrencySlot.release();
    }
  }
}

/**
 * Log STT usage to the database asynchronously (fire-and-forget).
 * Resolves tenantId from chatbotId and writes UsageRecord + DailyStats.
 */
async function logSTTUsage(
  chatbotId: string | null,
  conversationId: string | null,
  provider: "OPENAI" | "SARVAM",
  model: string,
  duration: number
) {
  if (!chatbotId) return;

  try {
    const chatbot = await getChatbotTenant(chatbotId);
    if (!chatbot) return;

    const tenantId = chatbot.tenantId;
    const pricingRates = await getSystemPricingRates();
    const cost = calculateVoiceCost(model, duration, pricingRates);

    // Strip time from date for DailyStats date-only key
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Promise.all([
      prisma.usageRecord.create({
        data: {
          tenantId,
          chatbotId,
          conversationId,
          provider,
          model,
          audioDuration: duration,
          requestType: "STT",
          cost,
          wholesaleCost: 0,
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
          sttRequests: 1,
          sttDuration: duration,
          voiceCost: cost,
          totalCost: cost,
          wholesaleCost: 0,
        },
        update: {
          sttRequests: { increment: 1 },
          sttDuration: { increment: duration },
          voiceCost: { increment: cost },
          totalCost: { increment: cost },
          wholesaleCost: { increment: 0 },
        },
      }),
    ]);
  } catch (err) {
    console.error("Failed logging STT usage:", err);
  }
}
