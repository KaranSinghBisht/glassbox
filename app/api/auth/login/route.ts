import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

const AUTH_COOKIE_NAME = "glassbox_token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

export async function POST(request: NextRequest) {
  const { allowed, resetAt } = checkRateLimit(request, 5, 60_000, "auth/login");
  if (!allowed) {
    return rateLimitResponse(resetAt);
  }

  const adminToken = process.env.GLASSBOX_ADMIN_TOKEN;

  if (!adminToken) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 400 });
  }

  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.token || body.token !== adminToken) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE_NAME, body.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}
