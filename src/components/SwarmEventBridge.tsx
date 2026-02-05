"use client";

import { useEffect, useRef, useCallback } from "react";
import { SwarmEvent } from "@/lib/schemas";

const MAX_RECONNECT_DELAY = 30000;
const BASE_RECONNECT_DELAY = 1000;

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
  onRunCompleted?: (status: string) => void;
  onError?: (error: Error) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onRawEvent?: (event: SwarmEvent) => void;
}

export function useSwarmEvents(props: SwarmEventBridgeProps) {
  const {
    runId,
    onAgentSpawned,
    onAgentStatusChange,
    onEdgeActivate,
    onArtifactCreated,
    onApprovalRequired,
    onRunCompleted,
    onError,
    onConnected,
    onDisconnected,
    onRawEvent,
  } = props;

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef(0);
  const isConnectingRef = useRef(false);
  const connectRef = useRef<() => void>(() => {});
  const seenEventIdsRef = useRef<Set<string>>(new Set());
  const lastRunIdRef = useRef<string | undefined>(undefined);

  const handleEvent = useCallback(
    (event: SwarmEvent) => {
      const eventId = event.id || `${event.type}-${event.ts}-${event.agentId || ""}`;
      if (seenEventIdsRef.current.has(eventId)) {
        return;
      }
      seenEventIdsRef.current.add(eventId);

      onRawEvent?.(event);
      
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

        case "RUN_COMPLETED":
          if (event.payload) {
            onRunCompleted?.(event.payload.status);
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
      onRunCompleted,
      onError,
      onRawEvent,
    ]
  );

  const connect = useCallback(() => {
    if (!runId) {
      return;
    }

    if (isConnectingRef.current || eventSourceRef.current?.readyState === EventSource.OPEN) {
      return;
    }

    if (lastRunIdRef.current !== runId) {
      seenEventIdsRef.current.clear();
      lastRunIdRef.current = runId;
    }

    isConnectingRef.current = true;
    
    const url = `/api/run/events?runId=${encodeURIComponent(runId)}`;

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      isConnectingRef.current = false;
      reconnectAttemptRef.current = 0;
      onConnected?.();
    };

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "connected") return;
        handleEvent(data as SwarmEvent);
      } catch (err) {
        console.error("Failed to parse event:", err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      eventSourceRef.current = null;
      isConnectingRef.current = false;
      onDisconnected?.();
      
      const delay = Math.min(
        BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttemptRef.current),
        MAX_RECONNECT_DELAY
      );
      reconnectAttemptRef.current++;
      
      reconnectTimeoutRef.current = setTimeout(() => connectRef.current(), delay);
    };
  }, [runId, onConnected, onDisconnected, handleEvent]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      isConnectingRef.current = false;
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
