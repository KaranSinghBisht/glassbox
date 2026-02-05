import { NextResponse } from "next/server";
import { getAgentLLMClient } from "@/lib/llm";

export async function GET() {
  try {
    const client = getAgentLLMClient();
    const metrics = client.getMetrics();
    return NextResponse.json(metrics);
  } catch {
    return NextResponse.json(
      { inputTokens: 0, outputTokens: 0, calls: 0, estimatedCost: 0 },
      { status: 200 }
    );
  }
}

export async function DELETE() {
  try {
    const client = getAgentLLMClient();
    client.clearMetrics();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
