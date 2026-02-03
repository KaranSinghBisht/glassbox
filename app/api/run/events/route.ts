import { eventBus } from "@/lib/eventBus";
import { SwarmEvent } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const runId = url.searchParams.get("runId");

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
      );

      const sendEvent = (event: SwarmEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          unsubscribe();
        }
      };

      const unsubscribe = runId
        ? eventBus.subscribeToRun(runId, sendEvent)
        : eventBus.subscribe(sendEvent);

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 30000);

      request.signal.addEventListener("abort", () => {
        unsubscribe();
        clearInterval(heartbeat);
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
