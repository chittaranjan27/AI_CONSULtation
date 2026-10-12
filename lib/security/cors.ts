import { NextResponse } from "next/server";

/**
 * Extracts and normalizes hostname from an Origin, Referer, or URL string.
 * Example: "https://shop.example.com:3000/embed" -> "shop.example.com"
 */
export function extractHostname(urlOrOrigin: string | null | undefined): string | null {
  if (!urlOrOrigin) return null;

  try {
    const trimmed = urlOrOrigin.trim();
    // Add protocol if missing to parse via URL API
    const withProtocol = trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;

    const parsed = new URL(withProtocol);
    return parsed.hostname.toLowerCase();
  } catch {
    // Fallback: strip protocol and path manually
    const stripped = urlOrOrigin
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      .split(":")[0]
      .trim()
      .toLowerCase();
    return stripped || null;
  }
}

/**
 * Parses allowed domains from widgetConfig.allowedDomains.
 * Supports string array (["a.com", "b.com"]) or comma-separated string ("a.com, b.com").
 */
export function parseAllowedDomains(
  allowedDomains: unknown
): string[] {
  if (!allowedDomains) return [];

  if (Array.isArray(allowedDomains)) {
    return allowedDomains
      .map((d) => String(d).trim().toLowerCase())
      .filter(Boolean);
  }

  if (typeof allowedDomains === "string") {
    return allowedDomains
      .split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
  }

  return [];
}

/**
 * Validates whether an incoming request's Origin or Referer is permitted for this chatbot.
 *
 * Rules:
 * 1. If no allowed domains are configured (empty or contains '*'), all origins are permitted.
 * 2. In non-production environments (development), localhost & 127.0.0.1 are always permitted.
 * 3. The platform's own domain (NEXT_PUBLIC_APP_URL) is always permitted for dashboard previews.
 * 4. Subdomains are supported (e.g. "*.example.com" or "example.com" allows "shop.example.com").
 */
export function isDomainAllowed(
  req: Request,
  allowedDomainsConfig: unknown
): { allowed: boolean; origin: string | null; hostname: string | null } {
  const originHeader = req.headers.get("origin");
  const refererHeader = req.headers.get("referer");
  const hostHeader = req.headers.get("host");

  const effectiveSource = originHeader || refererHeader;
  const hostname = extractHostname(effectiveSource);

  // Parse configured allowed domains
  const allowedList = parseAllowedDomains(allowedDomainsConfig);

  // If no allowed domains specified, unrestricted access is granted
  if (allowedList.length === 0 || allowedList.includes("*")) {
    return { allowed: true, origin: originHeader, hostname };
  }

  // Same-origin dashboard preview check (always allowed)
  const appHost = extractHostname(process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL);
  const currentHost = extractHostname(hostHeader);
  if (hostname && (hostname === appHost || hostname === currentHost)) {
    return { allowed: true, origin: originHeader, hostname };
  }

  // Localhost development exemption
  if (process.env.NODE_ENV !== "production") {
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return { allowed: true, origin: originHeader, hostname };
    }
  }

  // If strict allowed domains are set, but request has no Origin or Referer header
  if (!hostname) {
    // Disallow unverified cross-origin direct calls if restrictions are configured
    return { allowed: false, origin: originHeader, hostname: null };
  }

  // Check matching against allowed domains list
  const matches = allowedList.some((allowedDomain) => {
    const cleanAllowed = allowedDomain.replace(/^https?:\/\//i, "").split("/")[0].split(":")[0];

    // Exact match
    if (hostname === cleanAllowed) {
      return true;
    }

    // Wildcard prefix match: "*.example.com" or ".example.com"
    if (cleanAllowed.startsWith("*.")) {
      const baseDomain = cleanAllowed.slice(2);
      return hostname === baseDomain || hostname.endsWith(`.${baseDomain}`);
    }

    if (cleanAllowed.startsWith(".")) {
      const baseDomain = cleanAllowed.slice(1);
      return hostname === baseDomain || hostname.endsWith(`.${baseDomain}`);
    }

    // Default: also match subdomains of the allowed domain (e.g. shop.domain.com for domain.com)
    if (hostname.endsWith(`.${cleanAllowed}`)) {
      return true;
    }

    return false;
  });

  return { allowed: matches, origin: originHeader, hostname };
}

/**
 * Generates CORS headers for responses.
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PATCH, DELETE",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With, X-Chatbot-Id, X-Conversation-Id",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * Handles HTTP OPTIONS preflight request.
 */
export function handleCorsPreflight(req: Request): NextResponse {
  const origin = req.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}
