"use client";

import { useEffect, useRef, useCallback } from "react";
import { SwarmEvent } from "@/lib/schemas";

export interface SwarmEventBridgeProps {
  runId?: string;
  onAgentSpawned?: (
    agentId: string,
    name: string,
    role: string,
    parentId?: string
  ) => void;
  onAgentStatusChange?: (agentId: string, status: string) => void;
  onEdgeActivate?: (sourceId: string, targetId: string, active: boolean) => void;
  onArtifactCreated?: (artifactId: string, name: string, agentId: string) => void;
  onApprovalRequired?: (proposalId: string, actionId: string, title: string) => void;
  onError?: (error: Error) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export function useSwarmEvents(props: SwarmEventBridgeProps) {
  const {
    runId,
    onAgentSpawned,
    onAgentStatusChange,
    onEdgeActivate,
    onArtifactCreated,
    onApprovalRequired,
    onError,
    onConnected,
    onDisconnected,
  } = props;

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    const url = runId
      ? `/api/run/events?runId=${encodeURIComponent(runId)}`
      : "/api/run/events";

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      onConnected?.();
    };

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        if (data.type === "connected") {
          return;
        }

        const event = data as SwarmEvent;
        handleEvent(event);
      } catch (err) {
        console.error("Failed to parse event:", err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      onDisconnected?.();

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };
  }, [runId, onConnected, onDisconnected]);

  const handleEvent = useCallback(
    (event: SwarmEvent) => {
      switch (event.type) {
        case "AGENT_SPAWNED":
          if (event.agentId && event.payload) {
            onAgentSpawned?.(
              event.agentId,
              event.payload.name,
              event.payload.role,
              event.payload.parentId
            );
            if (event.payload.parentId) {
              onEdgeActivate?.(event.payload.parentId, event.agentId, true);
              setTimeout(() => {
                onEdgeActivate?.(event.payload.parentId!, event.agentId!, false);
              }, 2000);
            }
          }
          break;

        case "AGENT_STATUS":
          if (event.agentId && event.payload) {
            onAgentStatusChange?.(event.agentId, event.payload.status);
          }
          break;

        case "ARTIFACT_CREATED":
          if (event.agentId && event.payload) {
            onArtifactCreated?.(
              event.payload.artifactId,
              event.payload.name,
              event.agentId
            );
          }
          break;

        case "APPROVAL_REQUIRED":
          if (event.payload) {
            onApprovalRequired?.(
              event.payload.proposalId,
              event.payload.actionId,
              event.payload.title
            );
          }
          break;

        case "ERROR":
          if (event.payload) {
            onError?.(new Error(event.payload.message));
          }
          break;
      }
    },
    [
      onAgentSpawned,
      onAgentStatusChange,
      onEdgeActivate,
      onArtifactCreated,
      onApprovalRequired,
      onError,
    ]
  );

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  return { disconnect };
}

export default function SwarmEventBridge(props: SwarmEventBridgeProps) {
  useSwarmEvents(props);
  return null;
}
