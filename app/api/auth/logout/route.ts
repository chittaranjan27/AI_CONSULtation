import { NextRequest, NextResponse } from "next/server";

// GET — browser redirect (e.g. <a href="/api/auth/logout">)
export async function GET(req: NextRequest) {
  // Use the actual request origin so we don't break on http vs https mismatch
  const redirectUrl = new URL("/login", req.url);
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
