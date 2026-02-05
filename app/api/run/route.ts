import { startRun } from "@/lib/runOrchestrator";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { allowed, resetAt } = checkRateLimit(request, 10, 60_000);
  if (!allowed) {
    return rateLimitResponse(resetAt);
  }

  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const runId = await startRun(prompt);

    return NextResponse.json({ runId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
