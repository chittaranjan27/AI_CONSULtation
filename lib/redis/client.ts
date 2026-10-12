import Redis, { RedisOptions } from "ioredis";

// Ensure this utility is strictly server-only
if (typeof window !== "undefined") {
  throw new Error("Security alert: lib/redis/client cannot be bundled or executed on the client.");
}

interface GlobalRedisState {
  redisClient: Redis | null;
  isConnecting: boolean;
  isReady: boolean;
}

const globalForRedis = globalThis as unknown as {
  __bgRedisState?: GlobalRedisState;
};

const state: GlobalRedisState = globalForRedis.__bgRedisState || {
  redisClient: null,
  isConnecting: false,
  isReady: false,
};

if (process.env.NODE_ENV !== "production") {
  globalForRedis.__bgRedisState = state;
}

/**
 * Returns a configured, singleton ioredis client.
 * Returns null if REDIS_URL is not set.
 */
export function getRedisClient(): Redis | null {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) {
    return null;
  }

  if (state.redisClient) {
    return state.redisClient;
  }

  try {
    const options: RedisOptions = {
      connectTimeout: 3000,
      commandTimeout: 3000,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy(times) {
        // Stop reconnecting after 2 tries when host is offline
        if (times > 2) {
          return null;
        }
        return Math.min(times * 150, 500);
      },
    };

    const client = new Redis(redisUrl, options);

    client.on("connect", () => {
      state.isReady = true;
    });

    client.on("ready", () => {
      state.isReady = true;
    });

    client.on("error", () => {
      state.isReady = false;
      // Quiet mode during test/dev when Redis is offline
    });

    client.on("close", () => {
      state.isReady = false;
    });

    client.on("end", () => {
      state.isReady = false;
    });

    // Initiate connection asynchronously
    client.connect().catch(() => {
      state.isReady = false;
    });

    state.redisClient = client;

    // Graceful shutdown registration (prevent hanging process)
    if (typeof process !== "undefined" && typeof process.on === "function") {
      const shutdown = async () => {
        if (state.redisClient) {
          try {
            await state.redisClient.quit();
          } catch {
            state.redisClient.disconnect();
          }
          state.redisClient = null;
          state.isReady = false;
        }
      };

      process.once("SIGTERM", shutdown);
      process.once("SIGINT", shutdown);
    }

    return state.redisClient;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[REDIS] Initialization failed: ${msg}`);
    return null;
  }
}

/**
 * Checks whether Redis is currently reachable and responding to PING.
 * Returns true if Redis is ready and pings successfully within the timeout.
 */
export async function checkRedisHealth(timeoutMs = 1500): Promise<{ healthy: boolean; latencyMs: number }> {
  const client = getRedisClient();
  if (!client) {
    return { healthy: false, latencyMs: 0 };
  }

  const start = Date.now();
  try {
    const pingPromise = client.ping();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Redis PING timed out")), timeoutMs)
    );

    const result = await Promise.race([pingPromise, timeoutPromise]);
    const latencyMs = Date.now() - start;

    return {
      healthy: result === "PONG",
      latencyMs,
    };
  } catch {
    return {
      healthy: false,
      latencyMs: Date.now() - start,
    };
  }
}

/**
 * Safe Redis GET helper with automatic JSON parsing.
 */
export async function redisGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client || !state.isReady) return null;

  try {
    const raw = await client.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Safe Redis SETEX helper with automatic JSON serialization.
 */
export async function redisSet<T>(key: string, value: T, ttlSeconds: number): Promise<boolean> {
  const client = getRedisClient();
  if (!client || !state.isReady) return false;

  try {
    const serialized = JSON.stringify(value);
    await client.setex(key, ttlSeconds, serialized);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe Redis DEL helper for cache invalidation.
 */
export async function redisDel(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client || !state.isReady) return false;

  try {
    await client.del(key);
    return true;
  } catch {
    return false;
  }
}
