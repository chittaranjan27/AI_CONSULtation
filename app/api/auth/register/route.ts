import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: "Public registration is disabled. Please contact your administrator to set up an account." },
    { status: 403 }
  );
}

