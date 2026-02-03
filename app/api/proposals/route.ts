import { getPendingProposals } from "@/lib/approvalService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const runId = request.nextUrl.searchParams.get("runId") ?? undefined;
    const proposals = await getPendingProposals(runId);
    return NextResponse.json(proposals);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
