import { getPendingProposals } from "@/lib/approvalService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const runId = request.nextUrl.searchParams.get("runId") ?? undefined;
    const proposals = await getPendingProposals(runId);
    return NextResponse.json(proposals);
  } catch (error) {
    console.error("[api/proposals] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
