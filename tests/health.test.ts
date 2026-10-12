import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { GET } from "../app/api/health/route";

describe("Phase 3: Production Health-Check Endpoint Tests", () => {
  test("1. Liveness check (?check=liveness) returns HTTP 200 with process status", async () => {
    const req = new Request("http://localhost:3000/api/health?check=liveness");
    const res = await GET(req);

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, "ok");
    assert.ok(typeof data.uptimeSeconds === "number");
    assert.ok(data.timestamp);

    // Verify cache prevention headers
    const cacheControl = res.headers.get("Cache-Control");
    assert.ok(cacheControl?.includes("no-store"));
    assert.ok(cacheControl?.includes("no-cache"));
  });

  test("2. Readiness check (/api/health) validates database and does not leak secrets", async () => {
    const req = new Request("http://localhost:3000/api/health");
    const res = await GET(req);

    // Should return 200 if DB is connected
    assert.equal(res.status, 200);
    const data = await res.json();

    assert.ok(["healthy", "degraded"].includes(data.status));
    assert.equal(data.checks.process, "ok");
    assert.equal(data.checks.database.status, "connected");

    // Zero secret leak verification
    const bodyString = JSON.stringify(data);
    assert.ok(!bodyString.includes("postgres://"), "Must never leak database connection string");
    assert.ok(!bodyString.includes("password"), "Must never leak passwords");
    assert.ok(!bodyString.includes("secret"), "Must never leak secrets");
    assert.ok(!bodyString.includes("neon.tech"), "Must never leak internal hostnames");
  });
});
