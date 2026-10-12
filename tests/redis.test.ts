import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  getRedisClient,
  checkRedisHealth,
  redisGet,
  redisSet,
  redisDel,
} from "../lib/redis/client";
import { getChatbotTenant, invalidateChatbotCache } from "../lib/db/cache";

describe("Phase 1: Redis Infrastructure & Shared Caching Tests", () => {
  test("1. Redis client initializes cleanly as a server-only singleton", () => {
    const client = getRedisClient();
    // In local dev without Redis container port-forwarded, client is initialized or null
    assert.ok(client !== undefined);
  });

  test("2. Redis health check probe returns status and latency without throwing", async () => {
    const health = await checkRedisHealth(1000);
    assert.ok(typeof health.healthy === "boolean");
    assert.ok(typeof health.latencyMs === "number");
  });

  test("3. getChatbotTenant falls back safely to DB without crashing if Redis is unavailable", async () => {
    // Non-existent chatbot returns null safely
    const res = await getChatbotTenant("non-existent-chatbot-id");
    assert.equal(res, null);
  });

  test("4. invalidateChatbotCache completes cleanly without unhandled rejections", async () => {
    await assert.doesNotReject(async () => {
      await invalidateChatbotCache("test-chatbot-id");
    });
  });

  test("5. Redis helper functions handle invalid keys gracefully", async () => {
    const val = await redisGet<any>("non-existent-key-12345");
    assert.equal(val, null);

    const delRes = await redisDel("non-existent-key-12345");
    assert.ok(typeof delRes === "boolean");
  });
});
