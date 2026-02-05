import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "glassbox_token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

export async function POST(request: NextRequest) {
  const adminToken = process.env.GLASSBOX_ADMIN_TOKEN;

  if (!adminToken) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 400 });
  }

  const { token } = await request.json();

  if (token !== adminToken) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}
