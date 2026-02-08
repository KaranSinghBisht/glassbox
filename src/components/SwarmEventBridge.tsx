"use client";

import { useEffect, useRef, useCallback } from "react";
import { SwarmEvent } from "@/lib/schemas";

const MAX_RECONNECT_DELAY = 30000;
const BASE_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_ATTEMPTS = 10;

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
  const connectRef = useRef<() => void>(() => {});
  const seenEventIdsRef = useRef<Set<string>>(new Set());
  const lastRunIdRef = useRef<string | undefined>(undefined);
  const parentMapRef = useRef<Map<string, string>>(new Map());

  const handleEventRef = useRef<(event: SwarmEvent) => void>(() => {});

  handleEventRef.current = (event: SwarmEvent) => {
    const eventId = event.id || `${event.type}-${event.ts}-${event.agentId || ""}`;
    if (seenEventIdsRef.current.has(eventId)) {
      return;
    }
    seenEventIdsRef.current.add(eventId);

    onRawEvent?.(event);

    switch (event.type) {
      case "AGENT_SPAWNED":
        if (event.agentId && event.payload) {
          if (event.payload.parentId) {
            parentMapRef.current.set(event.agentId, event.payload.parentId);
          }
          onAgentSpawned?.(
            event.agentId,
            event.payload.name,
            event.payload.role,
            event.payload.parentId
          );
        }
        break;

      case "AGENT_STATUS":
        if (event.agentId && event.payload) {
          onAgentStatusChange?.(event.agentId, event.payload.status);
          const parentId = parentMapRef.current.get(event.agentId);
          if (parentId) {
            const activeStatuses = new Set(["thinking", "acting", "waiting"]);
            const active = activeStatuses.has(event.payload.status);
            onEdgeActivate?.(parentId, event.agentId, active);
          }
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
  };

  const onConnectedRef = useRef(onConnected);
  onConnectedRef.current = onConnected;
  const onDisconnectedRef = useRef(onDisconnected);
  onDisconnectedRef.current = onDisconnected;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    if (!runId) return;

    seenEventIdsRef.current.clear();
    parentMapRef.current.clear();
    lastRunIdRef.current = runId;

    const url = `/api/run/events?runId=${encodeURIComponent(runId)}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      reconnectAttemptRef.current = 0;
      onConnectedRef.current?.();
    };

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "connected") return;
        handleEventRef.current(data as SwarmEvent);
      } catch (err) {
        console.error("Failed to parse event:", err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      eventSourceRef.current = null;
      onDisconnectedRef.current?.();

      const delay = Math.min(
        BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttemptRef.current),
        MAX_RECONNECT_DELAY
      );
      reconnectAttemptRef.current++;

      if (reconnectAttemptRef.current > MAX_RECONNECT_ATTEMPTS) {
        onErrorRef.current?.(new Error("Max reconnection attempts reached"));
        return;
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        connectRef.current();
      }, delay);
    };

    connectRef.current = () => {
      if (eventSourceRef.current?.readyState === EventSource.OPEN) return;
      const es = new EventSource(url);
      eventSourceRef.current = es;
      es.onopen = eventSource.onopen;
      es.onmessage = eventSource.onmessage;
      es.onerror = eventSource.onerror;
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [runId]);

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
