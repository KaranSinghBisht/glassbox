import { eventBus } from "@/lib/eventBus";
import { SwarmEvent } from "@/lib/schemas";
import { db, events, runs } from "@/db";
import { eq, asc, and, gt } from "drizzle-orm";
import { startRun } from "@/lib/runOrchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const POLL_INTERVAL_MS = 800;

function toSwarmEvent(row: typeof events.$inferSelect): SwarmEvent {
  return {
    id: row.id,
    type: row.type,
    runId: row.runId,
    agentId: row.agentId ?? undefined,
    ts: row.timestamp.getTime(),
    payload: row.payload,
  } as SwarmEvent;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const runId = url.searchParams.get("runId");

  if (!runId) {
    return new Response(JSON.stringify({ error: "runId parameter is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const aborted = () => request.signal.aborted;

      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
      );

      const sentEventIds = new Set<string>();

      const send = (event: SwarmEvent) => {
        const eventId = event.id || `${event.type}-${event.ts}`;
        if (sentEventIds.has(eventId)) return;
        sentEventIds.add(eventId);
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // noop: stream closed by client
        }
      };

      const unsubscribe = eventBus.subscribeToRun(runId, send);

      const run = await db.query.runs.findFirst({ where: eq(runs.id, runId) });
      if (run && run.status === "pending") {
        startRun(runId, run.prompt);
      }

      const historicalRows = await db
        .select()
        .from(events)
        .where(eq(events.runId, runId))
        .orderBy(asc(events.timestamp));

      for (const row of historicalRows) {
        send(toSwarmEvent(row));
      }

      let lastPollTime = historicalRows.length > 0
        ? historicalRows[historicalRows.length - 1].timestamp
        : new Date(0);

      const poll = setInterval(async () => {
        if (aborted()) {
          clearInterval(poll);
          return;
        }
        try {
          const newRows = await db
            .select()
            .from(events)
            .where(and(eq(events.runId, runId), gt(events.timestamp, lastPollTime)))
            .orderBy(asc(events.timestamp));

          for (const row of newRows) {
            send(toSwarmEvent(row));
            if (row.timestamp > lastPollTime) {
              lastPollTime = row.timestamp;
            }
          }

          const currentRun = await db.query.runs.findFirst({ where: eq(runs.id, runId) });
          if (currentRun && (currentRun.status === "completed" || currentRun.status === "failed")) {
            const finalRows = await db
              .select()
              .from(events)
              .where(and(eq(events.runId, runId), gt(events.timestamp, lastPollTime)))
              .orderBy(asc(events.timestamp));
            for (const row of finalRows) {
              send(toSwarmEvent(row));
            }
            clearInterval(poll);
          }
        } catch {
          // noop: poll failed, retries next interval
        }
      }, POLL_INTERVAL_MS);

      const heartbeat = setInterval(() => {
        if (aborted()) {
          clearInterval(heartbeat);
          return;
        }
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      request.signal.addEventListener("abort", () => {
        unsubscribe();
        clearInterval(heartbeat);
        clearInterval(poll);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
