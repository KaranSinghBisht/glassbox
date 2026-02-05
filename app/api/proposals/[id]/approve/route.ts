import { approveProposal } from "@/lib/approvalService";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { allowed, resetAt } = checkRateLimit(request, 30, 60_000);
  if (!allowed) {
    return rateLimitResponse(resetAt);
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const result = await approveProposal(id, body.reason);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
