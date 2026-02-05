import { NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "glassbox_token";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
