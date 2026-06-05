import { NextRequest, NextResponse } from "next/server";

// GET — browser redirect (e.g. <a href="/api/auth/logout">)
export async function GET(req: NextRequest) {
  // Use the public application URL to avoid redirecting to the internal proxy port (localhost:8890)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || req.url;
  const redirectUrl = new URL("/login", baseUrl);
  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set("session_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // delete immediately
  });

  return response;
}

// POST — API call (fetch-based logout)
export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out" });

  response.cookies.set("session_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
