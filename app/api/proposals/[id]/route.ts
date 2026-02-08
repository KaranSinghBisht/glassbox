import { getProposal } from "@/lib/approvalService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const proposal = await getProposal(id);

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    return NextResponse.json(proposal);
  } catch (error) {
    console.error("[api/proposals/id] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
