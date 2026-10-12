import { NextResponse } from "next/server";

export interface RateLimitOptions {
  /** Maximum number of requests allowed within the window */
  limit: number;
  /** Window size in seconds (e.g. 60 for 1 minute) */
  windowSeconds: number;
  /** Identifier prefix (e.g. "chat", "voice_stt", "voice_tts", "lead") */
  prefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
}

// In-memory sliding window store
interface WindowRecord {
  timestamps: number[];
}

// Global store to persist across fast hot-reloads
const globalRateLimit = globalThis as unknown as {
  rateLimitStore: Map<string, WindowRecord> | undefined;
  rateLimitCleanupTimer: NodeJS.Timeout | undefined;
};

const store = globalRateLimit.rateLimitStore ?? new Map<string, WindowRecord>();
if (process.env.NODE_ENV !== "production") {
  globalRateLimit.rateLimitStore = store;
}

// Periodic cleanup every 3 minutes to prevent memory leak
if (!globalRateLimit.rateLimitCleanupTimer) {
  globalRateLimit.rateLimitCleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      // Remove timestamps older than 5 minutes
      record.timestamps = record.timestamps.filter((ts) => now - ts < 300_000);
      if (record.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, 180_000);

  if (globalRateLimit.rateLimitCleanupTimer.unref) {
    globalRateLimit.rateLimitCleanupTimer.unref();
  }
}

/**
 * Extracts client IP address from standard proxy/CDN headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  return "127.0.0.1";
}

/**
 * Checks rate limit for a request using sliding window counter.
 *
 * @param req The incoming request
 * @param options Rate limit configuration
 * @param extraKey Optional extra differentiator (e.g. chatbotId or visitorId)
 */
export function checkRateLimit(
  req: Request,
  options: RateLimitOptions,
  extraKey?: string | null
): RateLimitResult {
  const ip = getClientIp(req);
  const prefix = options.prefix || "general";
  const key = extraKey ? `${prefix}:${ip}:${extraKey}` : `${prefix}:${ip}`;

  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;
  const windowStart = now - windowMs;

  let record = store.get(key);
  if (!record) {
    record = { timestamps: [] };
    store.set(key, record);
  }

  // Filter out timestamps outside the active window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  const reset = Math.ceil((now + windowMs) / 1000);

  if (record.timestamps.length >= options.limit) {
    const oldest = record.timestamps[0];
    const actualReset = Math.ceil((oldest + windowMs) / 1000);

    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      reset: actualReset,
    };
  }

  // Record this request
  record.timestamps.push(now);

  return {
    success: true,
    limit: options.limit,
    remaining: options.limit - record.timestamps.length,
    reset,
  };
}

/**
 * Generates an HTTP 429 Too Many Requests response with standard rate limit headers.
 */
export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfter = Math.max(1, result.reset - Math.floor(Date.now() / 1000));

  return NextResponse.json(
    {
      error: "Too Many Requests",
      message: `Rate limit exceeded. Please wait ${retryAfter} second${
        retryAfter === 1 ? "" : "s"
      } before trying again.`,
    },
    {
      status: 429,
      headers: {
        "Retry-After": retryAfter.toString(),
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.reset.toString(),
      },
    }
  );
}

// Predefined recommended rate limit profiles
export const RATE_LIMITS = {
  /** AI Streaming Chat: 25 messages per minute per client */
  CHAT: { limit: 25, windowSeconds: 60, prefix: "chat" },
  /** Voice Speech-to-Text: 15 audio clips per minute per client */
  VOICE_STT: { limit: 15, windowSeconds: 60, prefix: "voice_stt" },
  /** Voice Text-to-Speech: 20 speech clips per minute per client */
  VOICE_TTS: { limit: 20, windowSeconds: 60, prefix: "voice_tts" },
  /** Public Lead Submissions: 10 form submissions per minute per client */
  LEADS: { limit: 10, windowSeconds: 60, prefix: "leads" },
} as const;
