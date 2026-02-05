"use client";

import { useEffect, useRef } from "react";
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
        "Render `AuditSummary` with confidence, red flags, and a verification checklist.",
      ]
        .filter(Boolean)
        .join(" ");
    }
    case "AGENT_MESSAGE": {
      const payload = event.payload as { summary: string };
      return `Agent message: "${payload.summary}". Render \`AgentMessageCard\`.`;
    }
    case "ERROR": {
      const payload = event.payload as { code?: string; message: string; stack?: string };
      return [
        `Error: ${payload.code ? `${payload.code}: ` : ""}${payload.message}`,
        "Render `ErrorCard` with details from context.",
      ].join(" ");
    }
    default:
      return null;
  }
}

export default function TamboEventBridge({ events }: TamboEventBridgeProps) {
  const processedEventIdsRef = useRef<Set<string>>(new Set());
  const prevEventsLengthRef = useRef<number>(0);
  const { setValue, submit } = useTamboThreadInput();

  useEffect(() => {
    // When a new run starts we clear events in the dashboard. Clear bridge state too.
    if (events.length === 0 && prevEventsLengthRef.current > 0) {
      processedEventIdsRef.current.clear();
    }
    prevEventsLengthRef.current = events.length;
  }, [events.length]);

  useEffect(() => {
    let cancelled = false;

    const sendEventMessages = async () => {
      for (const event of events) {
        if (cancelled) return;

        const eventId = event.id || `${event.type}-${event.ts}-${event.agentId || ""}`;
        if (processedEventIdsRef.current.has(eventId)) continue;

        const message = formatEventForTambo(event);
        // Mark processed even if we don't send, to avoid re-checking forever.
        processedEventIdsRef.current.add(eventId);

        if (!message) continue;

        setValue(message);
        try {
          await submit({
            additionalContext: {
              swarmEvent: event,
            },
          });
        } catch (error) {
          // Avoid infinite retries; surface in console for debugging.
          console.error("Failed to send event to Tambo:", error);
        }
      }
    };

    sendEventMessages();

    return () => {
      cancelled = true;
    };
  }, [events, setValue, submit]);

  return null;
}

