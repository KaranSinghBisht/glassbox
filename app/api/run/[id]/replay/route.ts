import { NextRequest, NextResponse } from "next/server";
import { db, events } from "@/db";
import { eq, asc } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const runEvents = await db
      .select()
      .from(events)
      .where(eq(events.runId, id))
      .orderBy(asc(events.timestamp));

    if (runEvents.length === 0) {
      return NextResponse.json(
        { error: "No events found for this run" },
        { status: 404 }
      );
    }

    const baseTime = runEvents[0].timestamp.getTime();

    const replayData = runEvents.map((e) => ({
      id: e.id,
      type: e.type,
      agentId: e.agentId,
      payload: e.payload,
      timestamp: e.timestamp.toISOString(),
      delayMs: e.timestamp.getTime() - baseTime,
    }));

    return NextResponse.json({
      runId: id,
      totalEvents: replayData.length,
      durationMs:
        replayData.length > 0
          ? replayData[replayData.length - 1].delayMs
          : 0,
      events: replayData,
    });
  } catch (error) {
    console.error("[api/run/replay] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
