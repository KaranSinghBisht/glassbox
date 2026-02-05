import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous"
  );
}

export function checkRateLimit(
  request: NextRequest,
  limit = MAX_REQUESTS,
  windowMs = WINDOW_MS
): { allowed: boolean; remaining: number; resetAt: number } {
  const ip = getClientIp(request);
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

export function rateLimitResponse(resetAt: number): NextResponse {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Reset": String(resetAt),
      },
    }
  );
}

export function withRateLimit(
  handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>,
  limit?: number,
  windowMs?: number
) {
  return async (request: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
    const { allowed, remaining, resetAt } = checkRateLimit(request, limit, windowMs);

    if (!allowed) {
      return rateLimitResponse(resetAt);
    }

    const response = await handler(request, ...args);
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    response.headers.set("X-RateLimit-Reset", String(resetAt));
    return response;
  };
}
