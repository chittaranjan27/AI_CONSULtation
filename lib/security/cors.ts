import { NextResponse } from "next/server";

// Ensure this utility is strictly server-only
if (typeof window !== "undefined") {
  throw new Error("Security alert: lib/security/cors cannot be bundled on the client.");
}

export interface DomainValidationResult {
  allowed: boolean;
  origin: string | null;
  hostname: string | null;
  reason?: string;
}

/**
 * Robustly normalizes and extracts hostname from an Origin, Referer, or domain string.
 * Handles:
 * - Trailing dots (FQDN): "example.com." -> "example.com"
 * - Ports: "example.com:8080" -> "example.com"
 * - Schemes: "https://shop.example.com/path" -> "shop.example.com"
 * - Case normalization: "EXAMPLE.COM" -> "example.com"
 * - Malformed input / unsafe URL patterns: returns null
 */
export function normalizeHostname(input: string | null | undefined): string | null {
  if (!input || typeof input !== "string") return null;

  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  // Reject unsafe schemes / patterns
  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("vbscript:") ||
    trimmed.includes("<") ||
    trimmed.includes(">") ||
    trimmed.includes(" ")
  ) {
    return null;
  }

  try {
    const withScheme =
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`;

    const parsed = new URL(withScheme);
    let host = parsed.hostname.toLowerCase();

    // Remove trailing dots (DNS root reference)
    host = host.replace(/\.+$/, "");

    // Basic validity check: must contain at least one dot or be localhost
    if (host !== "localhost" && !host.includes(".")) {
      return null;
    }

    return host || null;
  } catch {
    return null;
  }
}

/** Backward-compatible alias for normalizeHostname */
export const extractHostname = normalizeHostname;

/**
 * Parses and sanitizes allowed domains from chatbot.widgetConfig.allowedDomains.
 * Rejects invalid patterns, empty strings, and unsafe schemes.
 */
export function parseAllowedDomains(allowedDomainsConfig: unknown): string[] {
  if (!allowedDomainsConfig) return [];

  let rawList: string[] = [];

  if (Array.isArray(allowedDomainsConfig)) {
    rawList = allowedDomainsConfig.map((d) => String(d).trim());
  } else if (typeof allowedDomainsConfig === "string") {
    rawList = allowedDomainsConfig.split(",").map((d) => d.trim());
  }

  const cleaned: string[] = [];
  for (const item of rawList) {
    if (!item) continue;

    // Check wildcard prefix
    if (item.startsWith("*.")) {
      const base = normalizeHostname(item.slice(2));
      if (base) cleaned.push(`*.${base}`);
      continue;
    }

    // Single wildcard '*'
    if (item === "*") {
      cleaned.push("*");
      continue;
    }

    const host = normalizeHostname(item);
    if (host) {
      cleaned.push(host);
    }
  }

  return cleaned;
}

/**
 * Validates whether an incoming HTTP request's Origin or Referer is permitted
 * to interact with a specific chatbot.
 *
 * Rules:
 * 1. If allowedDomains is empty or contains "*", all origins are permitted.
 * 2. In non-production (development), localhost & 127.0.0.1 are always permitted.
 * 3. The platform's own domain (NEXT_PUBLIC_APP_URL) is always permitted for dashboard previews.
 * 4. Exact domain matches (e.g., "customer.com").
 * 5. Wildcard subdomains (e.g., "*.customer.com" matches "app.customer.com" and "customer.com").
 * 6. Production requires HTTPS on remote origins.
 */
export function isDomainAllowed(
  req: Request,
  allowedDomainsConfig: unknown
): DomainValidationResult {
  const originHeader = req.headers.get("origin");
  const refererHeader = req.headers.get("referer");
  const hostHeader = req.headers.get("host");

  const effectiveSource = originHeader || refererHeader;
  const sourceHostname = normalizeHostname(effectiveSource);

  // In production, require HTTPS on incoming Origin if present (except localhost)
  if (process.env.NODE_ENV === "production" && originHeader) {
    if (originHeader.startsWith("http://") && !originHeader.includes("localhost") && !originHeader.includes("127.0.0.1")) {
      return {
        allowed: false,
        origin: null,
        hostname: sourceHostname,
        reason: "Insecure HTTP origin rejected. Embedded widgets in production require HTTPS.",
      };
    }
  }

  const allowedList = parseAllowedDomains(allowedDomainsConfig);

  // 1. Unrestricted mode (empty config or explicit "*")
  if (allowedList.length === 0 || allowedList.includes("*")) {
    return {
      allowed: true,
      origin: originHeader,
      hostname: sourceHostname,
    };
  }

  // 2. Same-origin platform dashboard preview (always permitted)
  const appHost = normalizeHostname(process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL);
  const currentHost = normalizeHostname(hostHeader);
  if (sourceHostname && (sourceHostname === appHost || sourceHostname === currentHost)) {
    return {
      allowed: true,
      origin: originHeader,
      hostname: sourceHostname,
    };
  }

  // 3. Localhost development exemption
  if (process.env.NODE_ENV !== "production") {
    if (sourceHostname === "localhost" || sourceHostname === "127.0.0.1") {
      return {
        allowed: true,
        origin: originHeader,
        hostname: sourceHostname,
      };
    }
  }

  // 4. Missing Origin/Referer header when strict allowed domains are configured
  if (!sourceHostname) {
    return {
      allowed: false,
      origin: null,
      hostname: null,
      reason: "Request origin missing or unverified.",
    };
  }

  // 5. Match against configured allowed domains
  const isMatch = allowedList.some((allowedPattern) => {
    // Exact hostname match
    if (sourceHostname === allowedPattern) {
      return true;
    }

    // Wildcard match ("*.example.com")
    if (allowedPattern.startsWith("*.")) {
      const baseDomain = allowedPattern.slice(2);
      return sourceHostname === baseDomain || sourceHostname.endsWith(`.${baseDomain}`);
    }

    // Default subdomain matching: "example.com" also covers "shop.example.com"
    if (sourceHostname.endsWith(`.${allowedPattern}`)) {
      return true;
    }

    return false;
  });

  if (!isMatch) {
    return {
      allowed: false,
      origin: null, // Do not reflect unauthorized origin
      hostname: sourceHostname,
      reason: `Domain '${sourceHostname}' is not in the chatbot's authorized domain allowlist.`,
    };
  }

  return {
    allowed: true,
    origin: originHeader,
    hostname: sourceHostname,
  };
}

/**
 * Returns CORS headers tailored specifically for an authorized origin.
 * Never reflects arbitrary origins.
 */
export function getCorsHeaders(validatedOrigin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PATCH, DELETE",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With, X-Chatbot-Id, X-Conversation-Id",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };

  if (validatedOrigin) {
    headers["Access-Control-Allow-Origin"] = validatedOrigin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
}

/**
 * Handles HTTP OPTIONS CORS preflight requests.
 */
export function handleCorsPreflight(req: Request, allowedDomainsConfig?: unknown): NextResponse {
  // If allowedDomainsConfig is provided, validate origin during preflight
  if (allowedDomainsConfig !== undefined) {
    const check = isDomainAllowed(req, allowedDomainsConfig);
    if (!check.allowed) {
      return new NextResponse(null, { status: 403 });
    }
    return new NextResponse(null, {
      status: 204,
      headers: getCorsHeaders(check.origin),
    });
  }

  const origin = req.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}
