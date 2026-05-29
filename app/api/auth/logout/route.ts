import { NextResponse } from "next/server";

// GET — browser redirect (e.g. <a href="/api/auth/logout">)
export async function GET() {
  const response = NextResponse.redirect(new URL("/", process.env.NEXTAUTH_URL || "http://localhost:3000"));

  response.cookies.set("admin_session", "", {
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

  response.cookies.set("admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
