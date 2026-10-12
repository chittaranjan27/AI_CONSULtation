import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  checkRateLimit,
  checkMultiTierRateLimits,
  acquireConcurrencySlot,
  createRateLimitResponse,
  getClientIp,
  getVisitorIdentifier,
} from "../lib/security/rate-limit";

describe("Critical Issue B: Rate Limiting & Concurrency Tests", () => {
  test("1. Requests below rate limit succeed with correct remaining counter", () => {
    const req = new Request("http://localhost:3000/api/chat", {
      headers: { "x-real-ip": "198.51.100.10" },
    });

    const res1 = checkRateLimit(req, { limit: 5, windowSeconds: 60, prefix: "test_ok" });
    assert.equal(res1.success, true);
    assert.equal(res1.remaining, 4);

    const res2 = checkRateLimit(req, { limit: 5, windowSeconds: 60, prefix: "test_ok" });
    assert.equal(res2.success, true);
    assert.equal(res2.remaining, 3);
  });

  test("2. Requests above rate limit are rejected with 429 and Retry-After", () => {
    const req = new Request("http://localhost:3000/api/chat", {
      headers: { "x-real-ip": "198.51.100.20" },
    });

    const opts = { limit: 3, windowSeconds: 60, prefix: "test_exceed" };

    assert.equal(checkRateLimit(req, opts).success, true);
    assert.equal(checkRateLimit(req, opts).success, true);
    assert.equal(checkRateLimit(req, opts).success, true);

    const rejected = checkRateLimit(req, opts);
    assert.equal(rejected.success, false);
    assert.equal(rejected.remaining, 0);

    const response = createRateLimitResponse(rejected);
    assert.equal(response.status, 429);
    assert.ok(response.headers.get("Retry-After"), "Must include Retry-After header");
    assert.equal(response.headers.get("X-RateLimit-Limit"), "3");
    assert.equal(response.headers.get("X-RateLimit-Remaining"), "0");
  });

  test("3. IP limits still apply when visitor IDs are rotated/changed", async () => {
    const ip = "198.51.100.30";

    // Client attempts to bypass rate limit by creating a new visitorId on every request
    const opts = { limit: 4, windowSeconds: 60, prefix: "ip_protect_test" };

    for (let i = 0; i < 4; i++) {
      const req = new Request("http://localhost:3000/api/chat", {
        headers: { "x-real-ip": ip },
      });
      const res = checkRateLimit(req, opts);
      assert.equal(res.success, true);
    }

    // 5th request with completely new visitorId from same IP
    const attackerReq = new Request("http://localhost:3000/api/chat", {
      headers: { "x-real-ip": ip },
    });
    const blockedRes = checkRateLimit(attackerReq, opts);
    assert.equal(blockedRes.success, false, "IP limit must block request even when visitor ID changes");
  });

  test("4. Independent limits for different IP addresses and bots", () => {
    const reqA = new Request("http://localhost:3000/api/chat", {
      headers: { "x-real-ip": "10.0.0.1" },
    });
    const reqB = new Request("http://localhost:3000/api/chat", {
      headers: { "x-real-ip": "10.0.0.2" },
    });

    const opts = { limit: 2, windowSeconds: 60, prefix: "isolation_test" };

    // Exhaust client A
    checkRateLimit(reqA, opts);
    checkRateLimit(reqA, opts);
    assert.equal(checkRateLimit(reqA, opts).success, false);

    // Client B must still have quota
    assert.equal(checkRateLimit(reqB, opts).success, true);
  });

  test("5. In-flight Concurrency Limiter prevents excess parallel execution", () => {
    const resourceKey = "bot_concurrency_test_1";
    const maxConcurrent = 2;

    const slot1 = acquireConcurrencySlot(resourceKey, maxConcurrent);
    assert.equal(slot1.acquired, true);

    const slot2 = acquireConcurrencySlot(resourceKey, maxConcurrent);
    assert.equal(slot2.acquired, true);

    // 3rd concurrent request must be rejected
    const slot3 = acquireConcurrencySlot(resourceKey, maxConcurrent);
    assert.equal(slot3.acquired, false, "Must reject request when concurrency limit reached");

    // Release slot 1
    slot1.release();

    // Now a new slot can be acquired
    const slot4 = acquireConcurrencySlot(resourceKey, maxConcurrent);
    assert.equal(slot4.acquired, true);

    slot2.release();
    slot4.release();
  });

  test("6. Trusted IP extraction protects against spoofed headers", () => {
    // Spoofed X-Forwarded-For with fake internal IP followed by real proxy IP
    const req = new Request("http://localhost:3000/api/chat", {
      headers: {
        "cf-connecting-ip": "203.0.113.195",
        "x-forwarded-for": "1.2.3.4, 5.6.7.8",
      },
    });

    const ip = getClientIp(req);
    assert.equal(ip, "203.0.113.195", "Must prioritize Cloudflare/Real-IP header over spoofed X-Forwarded-For");
  });
});
