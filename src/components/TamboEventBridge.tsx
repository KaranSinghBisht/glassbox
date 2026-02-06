"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTamboThreadInput } from "@tambo-ai/react";
import { SwarmEvent } from "@/lib/schemas";

interface TamboEventBridgeProps {
  events: SwarmEvent[];
}

function formatEventForTambo(event: SwarmEvent): string | null {
  switch (event.type) {
    case "ARTIFACT_CREATED": {
      const payload = event.payload as {
        artifactId: string;
        name: string;
        contentType?: string;
        contentPreview?: string;
      };
      return [
        `Artifact created: "${payload.name}".`,
        "Render `ArtifactViewer`.",
        "Use the provided `artifactId`, `name`, and `contentPreview` from context as the component props.",
      ].join(" ");
    }
    case "APPROVAL_REQUIRED": {
      const payload = event.payload as {
        proposalId: string;
        actionId: string;
        kind: string;
        title: string;
        risk: string;
      };
      return [
        `Approval required: "${payload.title}" (risk: ${payload.risk}).`,
        "Render `ActionProposalCard`.",
        "Use `proposalId` and `actionId` from context as props so the buttons can call the API.",
      ].join(" ");
    }
    case "RUN_CREATED": {
      const payload = event.payload as { prompt: string };
      return [
        `New run started for: "${payload.prompt}".`,
        "Render `TaskPlanCard` with a reasonable step plan and initial statuses.",
      ].join(" ");
    }
    case "RUN_COMPLETED": {
      const payload = event.payload as { status: string; summary?: string };
      return [
        `Run completed with status: ${payload.status}.`,
        payload.summary ? `Summary: ${payload.summary}` : "",
        payload.status === "success"
          ? "Render `MetricsSummary` with estimated token/cost data from context. Then render `AuditSummary` with confidence, red flags, and a verification checklist."
          : "Render `ErrorCard` with details from context.",
      ]
        .filter(Boolean)
        .join(" ");
    }
    case "AGENT_SPAWNED": {
      const payload = event.payload as {
        name: string;
        role: string;
        parentId?: string;
      };
      return [
        `Agent spawned: "${payload.name}" (${payload.role}).`,
        "Render `RunProgressCard` showing the current run progress with this new agent included.",
      ].join(" ");
    }
    case "AGENT_PROGRESS": {
      const payload = event.payload as {
        progress: string;
        percentage?: number;
        step?: string;
      };
      return `Agent progress: ${payload.progress}${payload.percentage !== undefined ? ` (${payload.percentage}%)` : ""}. Update the existing \`RunProgressCard\` if present.`;
    }
    case "AGENT_MESSAGE": {
      const payload = event.payload as { summary: string };
      return `Agent message: "${payload.summary}". Render \`AgentMessageCard\`.`;
    }
    case "ERROR": {
      const payload = event.payload as {
        code?: string;
        message: string;
        stack?: string;
      };
      return [
        `Error: ${payload.code ? `${payload.code}: ` : ""}${payload.message}`,
        "Render `ErrorCard` with details from context.",
      ].join(" ");
    }
    default:
      return null;
  }
}

const BATCH_DEBOUNCE_MS = 500;

export default function TamboEventBridge({ events }: TamboEventBridgeProps) {
  const processedEventIdsRef = useRef<Set<string>>(new Set());
  const prevEventsLengthRef = useRef<number>(0);
  const pendingEventsRef = useRef<SwarmEvent[]>([]);
  const batchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setValue, submit } = useTamboThreadInput();

  useEffect(() => {
    if (events.length === 0 && prevEventsLengthRef.current > 0) {
      processedEventIdsRef.current.clear();
      pendingEventsRef.current = [];
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
        batchTimerRef.current = null;
      }
    }
    prevEventsLengthRef.current = events.length;
  }, [events.length]);

  const processBatch = useCallback(async () => {
    const batch = pendingEventsRef.current.splice(0);
    if (batch.length === 0) return;

    // Combine batch messages
    const messages: string[] = [];
    const combinedContext: Record<string, unknown> = {
      batchSize: batch.length,
      eventTypes: [...new Set(batch.map((e) => e.type))],
    };

    for (const event of batch) {
      const msg = formatEventForTambo(event);
      if (msg) {
        messages.push(msg);
        // Add structured event data
        const key = `event_${event.type}_${event.agentId || "system"}`;
        combinedContext[key] = event;
      }
    }

    if (messages.length === 0) return;

    const combined = messages.join("\n\n");
    setValue(combined);

    try {
      await submit({
        additionalContext: {
          swarmEvents: batch,
          ...combinedContext,
        },
      });
    } catch (error) {
      console.error("Failed to send batched events to Tambo:", error);
    }
  }, [setValue, submit]);

  useEffect(() => {
    for (const event of events) {
      const eventId =
        event.id || `${event.type}-${event.ts}-${event.agentId || ""}`;
      if (processedEventIdsRef.current.has(eventId)) continue;
      processedEventIdsRef.current.add(eventId);

      const message = formatEventForTambo(event);
      if (!message) continue;

      pendingEventsRef.current.push(event);
    }

    // Debounce: wait for more events before sending batch
    if (pendingEventsRef.current.length > 0) {
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
      }

      // Send high-priority events (APPROVAL_REQUIRED, ERROR) immediately
      const hasUrgent = pendingEventsRef.current.some(
        (e) => e.type === "APPROVAL_REQUIRED" || e.type === "ERROR"
      );

      if (hasUrgent) {
        processBatch();
      } else {
        batchTimerRef.current = setTimeout(processBatch, BATCH_DEBOUNCE_MS);
      }
    }

    return () => {
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
        batchTimerRef.current = null;
      }
    };
  }, [events, processBatch]);

  return null;
}
