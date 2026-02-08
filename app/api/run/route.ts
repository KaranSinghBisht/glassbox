import { createRun, startRun } from "@/lib/runOrchestrator";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const { allowed, resetAt } = checkRateLimit(request, 10, 60_000);
  if (!allowed) {
    return rateLimitResponse(resetAt);
  }

  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (prompt.length > 10000) {
      return NextResponse.json(
        { error: "Prompt is too long (max 10,000 characters)" },
        { status: 400 }
      );
    }

    const trimmed = prompt.trim();
    const runId = await createRun(trimmed);

    startRun(runId, trimmed);

    return NextResponse.json({ runId });
  } catch (error) {
    console.error("[api/run] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
