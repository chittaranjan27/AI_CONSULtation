import prisma from "@/lib/db/prisma";
import { getChatbotTenant } from "@/lib/db/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/analytics/event
 *
 * Lightweight, unauthenticated endpoint for the embed widget to log behavioral events.
 * Validates chatbotId existence, resolves tenantId, and writes to AnalyticsEvent.
 * Also increments DailyStats.widgetOpens for "widget_open" events.
 *
 * Supported eventTypes:
 *   - widget_open        → user opens the chat widget
 *   - chat_start         → first message sent in a conversation
 *   - voice_start        → user activates voice mode
 *   - voice_end          → user ends voice session
 *   - consultation_complete → user reaches final step
 *   - product_click      → user clicks a product card
 *   - lead_captured      → lead form submitted
 *   - language_change    → user changes language
 */

const ALLOWED_EVENT_TYPES = new Set([
  "widget_open",
  "chat_start",
  "voice_start",
  "voice_end",
  "consultation_complete",
  "product_click",
  "lead_captured",
  "language_change",
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { chatbotId, visitorId, eventType, data, pageUrl, conversationId } = body;

    // Validate required fields
    if (!chatbotId || !eventType) {
      return NextResponse.json(
        { error: "Missing chatbotId or eventType" },
        { status: 400 }
      );
    }

    // Validate event type
    if (!ALLOWED_EVENT_TYPES.has(eventType)) {
      return NextResponse.json(
        { error: `Invalid eventType: ${eventType}` },
        { status: 400 }
      );
    }

    // Look up chatbot to resolve tenantId
    const chatbot = await getChatbotTenant(chatbotId);

    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }

    const tenantId = chatbot.tenantId;

    // Hash IP for privacy (simple hash — not cryptographic, just for grouping)
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const ipHash = await hashString(ip);

    // Write AnalyticsEvent
    const eventPromise = prisma.analyticsEvent.create({
      data: {
        tenantId,
        chatbotId,
        visitorId: visitorId || null,
        eventType,
        data: data ? (typeof data === "object" ? data : { value: data }) : null,
        pageUrl: pageUrl || null,
        userAgent: req.headers.get("user-agent") || null,
        ipHash,
      },
    });

    // For widget_open events, also increment DailyStats.widgetOpens
    const writes: Promise<unknown>[] = [eventPromise];

    if (eventType === "widget_open") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      writes.push(
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
            widgetOpens: 1,
          },
          update: {
            widgetOpens: { increment: 1 },
          },
        })
      );
    }

    // Fire all writes in parallel — don't block the response
    await Promise.all(writes);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[ANALYTICS_EVENT_API]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** Simple non-cryptographic hash for IP privacy */
async function hashString(str: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const data = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 16); // Truncate for brevity
  }
  // Fallback: simple hash
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}
