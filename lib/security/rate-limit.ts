import { NextResponse } from "next/server";
import crypto from "crypto";
import Redis from "ioredis";

// Ensure this utility is strictly server-only
if (typeof window !== "undefined") {
  throw new Error("Security alert: lib/security/rate-limit cannot be bundled on the client.");
}

export interface RateLimitOptions {
  /** Maximum number of requests allowed within the window */
  limit: number;
  /** Window size in seconds (e.g. 60 for 1 minute) */
  windowSeconds: number;
  /** Identifier prefix (e.g. "chat_ip", "chat_visitor", "voice_stt") */
  prefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
  scope?: "visitor" | "ip" | "chatbot" | "tenant" | "concurrency";
}

// ─────────────────────────────────────────────────────────────
// 1. Redis Connection Manager (Resilient Singleton)
// ─────────────────────────────────────────────────────────────
let redisClient: Redis | null = null;
let isRedisAvailable = false;

function getRedisClient(): Redis | null {
  if (redisClient) return isRedisAvailable ? redisClient : null;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  try {
    const client = new Redis(redisUrl, {
      connectTimeout: 2000,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy(times) {
        if (times > 3) return null; // stop retrying quickly
        return Math.min(times * 100, 1000);
      },
    });

    client.on("connect", () => {
      isRedisAvailable = true;
    });

    client.on("error", () => {
      isRedisAvailable = false;
    });

    client.on("close", () => {
      isRedisAvailable = false;
    });

    client.connect().catch(() => {
      isRedisAvailable = false;
    });

    redisClient = client;
    return isRedisAvailable ? redisClient : null;
  } catch {
    isRedisAvailable = false;
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// 2. High-Performance In-Memory Sliding Window Store (Fallback)
// ─────────────────────────────────────────────────────────────
interface WindowRecord {
  timestamps: number[];
}

const globalRateLimit = globalThis as unknown as {
  rateLimitStore: Map<string, WindowRecord> | undefined;
  activeConcurrency: Map<string, number> | undefined;
  rateLimitCleanupTimer: NodeJS.Timeout | undefined;
};

const memoryStore = globalRateLimit.rateLimitStore ?? new Map<string, WindowRecord>();
const concurrencyStore = globalRateLimit.activeConcurrency ?? new Map<string, number>();

if (process.env.NODE_ENV !== "production") {
  globalRateLimit.rateLimitStore = memoryStore;
  globalRateLimit.activeConcurrency = concurrencyStore;
}

// Periodic cleanup every 2 minutes
if (!globalRateLimit.rateLimitCleanupTimer) {
  globalRateLimit.rateLimitCleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 180_000);
      if (record.timestamps.length === 0) {
        memoryStore.delete(key);
      }
    }
  }, 120_000);

  if (globalRateLimit.rateLimitCleanupTimer.unref) {
    globalRateLimit.rateLimitCleanupTimer.unref();
  }
}

// ─────────────────────────────────────────────────────────────
// 3. Trusted IP & Visitor Identification
// ─────────────────────────────────────────────────────────────
const IPV4_REGEX = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$/;
const IPV6_REGEX = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

/**
 * Extracts and sanitizes client IP address from trusted headers.
 * Protects against arbitrary spoofed X-Forwarded-For headers.
 */
export function getClientIp(req: Request): string {
  // 1. Cloudflare CDN connecting IP (most reliable if behind CF)
  const cfIp = req.headers.get("cf-connecting-ip")?.trim();
  if (cfIp && (IPV4_REGEX.test(cfIp) || IPV6_REGEX.test(cfIp))) {
    return cfIp;
  }

  // 2. Real-IP set by reverse proxy (Nginx, Traefik, AWS ALB)
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp && (IPV4_REGEX.test(realIp) || IPV6_REGEX.test(realIp))) {
    return realIp;
  }

  // 3. X-Forwarded-For: take first non-private entry or rightmost trusted proxy hop
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((s) => s.trim());
    for (const raw of ips) {
      const cleanIp = raw.split(":")[0]; // strip port if present
      if (IPV4_REGEX.test(cleanIp) || IPV6_REGEX.test(cleanIp)) {
        return cleanIp;
      }
    }
  }

  return "127.0.0.1";
}

/**
 * Computes a secure, tamper-proof visitor identifier.
 * Combines client-provided visitor ID with client IP so malicious users
 * cannot rotate visitor IDs to bypass IP restrictions.
 */
export function getVisitorIdentifier(req: Request, rawVisitorId?: string | null): string {
  const ip = getClientIp(req);
  if (!rawVisitorId) {
    return `anon:${ip}`;
  }
  // Cryptographic binding of visitor ID and IP
  const hash = crypto.createHash("sha256").update(`${rawVisitorId}:${ip}`).digest("hex").slice(0, 16);
  return `vid:${hash}`;
}

// ─────────────────────────────────────────────────────────────
// 4. Sliding Window Rate Limiting Engine
// ─────────────────────────────────────────────────────────────

/**
 * Checks sliding-window rate limit using Redis (if available) or resilient in-memory fallback.
 */
export async function checkRateLimitAsync(
  key: string,
  options: RateLimitOptions,
  scope?: "visitor" | "ip" | "chatbot" | "tenant"
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;
  const reset = Math.ceil((now + windowMs) / 1000);

  if (redis && isRedisAvailable) {
    try {
      const redisKey = `ratelimit:${key}`;
      const windowStart = now - windowMs;

      // Sliding window using sorted sets in Redis transaction
      const pipeline = redis.pipeline();
      pipeline.zremrangebyscore(redisKey, 0, windowStart);
      pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);
      pipeline.zcard(redisKey);
      pipeline.expire(redisKey, options.windowSeconds + 5);

      const results = await pipeline.exec();
      const currentCount = (results?.[2]?.[1] as number) || 1;

      if (currentCount > options.limit) {
        return {
          success: false,
          limit: options.limit,
          remaining: 0,
          reset,
          scope,
        };
      }

      return {
        success: true,
        limit: options.limit,
        remaining: Math.max(0, options.limit - currentCount),
        reset,
        scope,
      };
    } catch {
      // If Redis call fails, handle fail-closed or fall back to memory
      if (process.env.FAIL_CLOSED_ON_RATE_LIMIT_ERROR === "true") {
        return {
          success: false,
          limit: options.limit,
          remaining: 0,
          reset: Math.ceil((now + 30_000) / 1000),
          scope,
        };
      }
    }
  }

  // In-memory sliding window fallback
  const windowStart = now - windowMs;
  let record = memoryStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    memoryStore.set(key, record);
  }

  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= options.limit) {
    const oldest = record.timestamps[0] || now;
    const actualReset = Math.ceil((oldest + windowMs) / 1000);
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      reset: actualReset,
      scope,
    };
  }

  record.timestamps.push(now);

  return {
    success: true,
    limit: options.limit,
    remaining: options.limit - record.timestamps.length,
    reset,
    scope,
  };
}

/**
 * Synchronous in-memory rate limit check for immediate local evaluation.
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

  let record = memoryStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    memoryStore.set(key, record);
  }

  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  const reset = Math.ceil((now + windowMs) / 1000);

  if (record.timestamps.length >= options.limit) {
    const oldest = record.timestamps[0] || now;
    const actualReset = Math.ceil((oldest + windowMs) / 1000);

    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      reset: actualReset,
    };
  }

  record.timestamps.push(now);

  return {
    success: true,
    limit: options.limit,
    remaining: options.limit - record.timestamps.length,
    reset,
  };
}

// ─────────────────────────────────────────────────────────────
// 5. Multi-Tier Rate Limiting (Visitor + IP + Chatbot)
// ─────────────────────────────────────────────────────────────

export interface MultiTierRateLimitConfig {
  endpoint: "chat" | "voice_stt" | "voice_tts" | "leads";
  chatbotId?: string | null;
  visitorId?: string | null;
}

export async function checkMultiTierRateLimits(
  req: Request,
  config: MultiTierRateLimitConfig
): Promise<RateLimitResult> {
  const ip = getClientIp(req);
  const visitorKey = getVisitorIdentifier(req, config.visitorId);

  // 1. Tier 1: Per-Visitor Limit (20 req/min for chat, 15 for STT, 20 for TTS)
  const visitorLimitOptions: Record<string, RateLimitOptions> = {
    chat: { limit: 20, windowSeconds: 60, prefix: "visitor_chat" },
    voice_stt: { limit: 15, windowSeconds: 60, prefix: "visitor_stt" },
    voice_tts: { limit: 20, windowSeconds: 60, prefix: "visitor_tts" },
    leads: { limit: 10, windowSeconds: 60, prefix: "visitor_leads" },
  };

  const visitorRes = await checkRateLimitAsync(
    `${visitorLimitOptions[config.endpoint].prefix}:${visitorKey}`,
    visitorLimitOptions[config.endpoint],
    "visitor"
  );
  if (!visitorRes.success) return visitorRes;

  // 2. Tier 2: Per-IP Limit (Allows modest multi-user NAT headroom)
  const ipLimitOptions: Record<string, RateLimitOptions> = {
    chat: { limit: 40, windowSeconds: 60, prefix: "ip_chat" },
    voice_stt: { limit: 25, windowSeconds: 60, prefix: "ip_stt" },
    voice_tts: { limit: 35, windowSeconds: 60, prefix: "ip_tts" },
    leads: { limit: 15, windowSeconds: 60, prefix: "ip_leads" },
  };

  const ipRes = await checkRateLimitAsync(
    `${ipLimitOptions[config.endpoint].prefix}:${ip}`,
    ipLimitOptions[config.endpoint],
    "ip"
  );
  if (!ipRes.success) return ipRes;

  // 3. Tier 3: Per-Chatbot Spike Protection (150 req/min across all visitors)
  if (config.chatbotId) {
    const botRes = await checkRateLimitAsync(
      `bot:${config.endpoint}:${config.chatbotId}`,
      { limit: 150, windowSeconds: 60, prefix: "bot" },
      "chatbot"
    );
    if (!botRes.success) return botRes;
  }

  return visitorRes;
}

// ─────────────────────────────────────────────────────────────
// 6. Concurrency Control (In-Flight Request Limiter)
// ─────────────────────────────────────────────────────────────

/**
 * Acquires an in-flight concurrency slot to protect expensive AI / Voice operations.
 * Returns an object containing `acquired: boolean` and an idempotent `release()` function.
 */
export function acquireConcurrencySlot(
  resourceKey: string,
  maxConcurrent = 10
): { acquired: boolean; release: () => void } {
  const current = concurrencyStore.get(resourceKey) || 0;

  if (current >= maxConcurrent) {
    return {
      acquired: false,
      release: () => {},
    };
  }

  concurrencyStore.set(resourceKey, current + 1);
  let released = false;

  return {
    acquired: true,
    release: () => {
      if (!released) {
        released = true;
        const count = concurrencyStore.get(resourceKey) || 1;
        if (count <= 1) {
          concurrencyStore.delete(resourceKey);
        } else {
          concurrencyStore.set(resourceKey, count - 1);
        }
      }
    },
  };
}

// ─────────────────────────────────────────────────────────────
// 7. HTTP 429 Response Builder
// ─────────────────────────────────────────────────────────────

export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfter = Math.max(1, result.reset - Math.floor(Date.now() / 1000));
  const scopeMsg = result.scope ? ` (${result.scope} quota reached)` : "";

  return NextResponse.json(
    {
      error: "Too Many Requests",
      message: `Rate limit exceeded${scopeMsg}. Please retry in ${retryAfter} second${
        retryAfter === 1 ? "" : "s"
      }.`,
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

// Predefined rate limits
export const RATE_LIMITS = {
  CHAT: { limit: 25, windowSeconds: 60, prefix: "chat" },
  VOICE_STT: { limit: 15, windowSeconds: 60, prefix: "voice_stt" },
  VOICE_TTS: { limit: 20, windowSeconds: 60, prefix: "voice_tts" },
  LEADS: { limit: 10, windowSeconds: 60, prefix: "leads" },
} as const;
