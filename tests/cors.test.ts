import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  isDomainAllowed,
  normalizeHostname,
  parseAllowedDomains,
  getCorsHeaders,
} from "../lib/security/cors";

describe("Critical Issue C: Allowed Domains & CORS Enforcement Tests", () => {
  beforeEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.brahmagraha.com";
  });

  test("1. Hostname normalization handles ports, trailing dots, and schemes safely", () => {
    assert.equal(normalizeHostname("https://example.com/path"), "example.com");
    assert.equal(normalizeHostname("HTTP://EXAMPLE.COM:8080/"), "example.com");
    assert.equal(normalizeHostname("example.com."), "example.com");
    assert.equal(normalizeHostname("sub.domain.co.uk"), "sub.domain.co.uk");
  });

  test("2. Rejects malformed and unsafe URL patterns", () => {
    assert.equal(normalizeHostname("javascript:alert(1)"), null);
    assert.equal(normalizeHostname("data:text/html,<script>"), null);
    assert.equal(normalizeHostname("not a valid hostname"), null);
    assert.equal(normalizeHostname(""), null);
    assert.equal(normalizeHostname(null), null);
  });

  test("3. Exact configured domain succeeds", () => {
    const req = new Request("http://localhost:3000/api/chat", {
      headers: { origin: "https://customer.com" },
    });

    const res = isDomainAllowed(req, ["customer.com", "partner.io"]);
    assert.equal(res.allowed, true);
    assert.equal(res.hostname, "customer.com");

    const cors = getCorsHeaders(res.origin);
    assert.equal(cors["Access-Control-Allow-Origin"], "https://customer.com");
    assert.equal(cors["Access-Control-Allow-Credentials"], "true");
  });

  test("4. Unapproved origin is rejected and denied CORS headers", () => {
    const req = new Request("http://localhost:3000/api/chat", {
      headers: { origin: "https://evil-attacker.com" },
    });

    const res = isDomainAllowed(req, ["customer.com"]);
    assert.equal(res.allowed, false);
    assert.ok(res.reason?.includes("not in the chatbot's authorized domain allowlist"));

    // Origin must NOT be reflected
    assert.equal(res.origin, null);
    const cors = getCorsHeaders(res.origin);
    assert.equal(cors["Access-Control-Allow-Origin"], undefined, "Must never reflect unapproved origin");
  });

  test("5. Wildcard subdomain matching (*.customer.com)", () => {
    const allowed = ["*.customer.com"];

    const req1 = new Request("http://localhost:3000/api/chat", {
      headers: { origin: "https://shop.customer.com" },
    });
    assert.equal(isDomainAllowed(req1, allowed).allowed, true);

    const req2 = new Request("http://localhost:3000/api/chat", {
      headers: { origin: "https://customer.com" },
    });
    assert.equal(isDomainAllowed(req2, allowed).allowed, true);

    const req3 = new Request("http://localhost:3000/api/chat", {
      headers: { origin: "https://notcustomer.com" },
    });
    assert.equal(isDomainAllowed(req3, allowed).allowed, false);
  });

  test("6. Platform dashboard origin is always permitted for admin previews", () => {
    const req = new Request("http://localhost:3000/api/chat", {
      headers: { origin: "https://app.brahmagraha.com" },
    });

    // Even if client configured strict third-party domain
    const res = isDomainAllowed(req, ["strict-external-domain.com"]);
    assert.equal(res.allowed, true, "Platform dashboard origin must be permitted for previews");
  });

  test("7. Missing origin header is rejected when strict domains are configured", () => {
    const req = new Request("http://localhost:3000/api/chat", {
      headers: {},
    });

    const res = isDomainAllowed(req, ["client.com"]);
    assert.equal(res.allowed, false);
    assert.equal(res.reason, "Request origin missing or unverified.");
  });

  test("8. Unrestricted mode (* or empty) permits open embedding", () => {
    const req = new Request("http://localhost:3000/api/chat", {
      headers: { origin: "https://any-site.org" },
    });

    assert.equal(isDomainAllowed(req, []).allowed, true);
    assert.equal(isDomainAllowed(req, ["*"]).allowed, true);
  });
});
