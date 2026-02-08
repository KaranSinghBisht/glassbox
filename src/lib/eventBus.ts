import { randomUUID } from "crypto";
import { SwarmEvent } from "./schemas";
import { db, events } from "@/db";

type EventListener = (event: SwarmEvent) => void;

class EventBus {
  private listeners: Map<string, Set<EventListener>> = new Map();
  private globalListeners: Set<EventListener> = new Set();

  subscribe(listener: EventListener): () => void {
    this.globalListeners.add(listener);
    return () => this.globalListeners.delete(listener);
  }

  subscribeToRun(runId: string, listener: EventListener): () => void {
    if (!this.listeners.has(runId)) {
      this.listeners.set(runId, new Set());
    }
    this.listeners.get(runId)!.add(listener);
    return () => this.listeners.get(runId)?.delete(listener);
  }

  emit(event: SwarmEvent): void {
    const eventId = randomUUID();
    const eventWithId = { ...event, id: eventId };

    void db.insert(events).values({
      id: eventId,
      runId: event.runId,
      agentId: event.agentId,
      type: event.type,
      payload: event.payload,
      timestamp: new Date(event.ts),
    }).catch((e: unknown) => {
      console.error("Failed to persist event to database:", e);
    });

    this.globalListeners.forEach((listener) => {
      try {
        listener(eventWithId);
      } catch (e) {
        console.error("Event listener error:", e);
      }
    });

    const runListeners = this.listeners.get(event.runId);
    if (runListeners) {
      runListeners.forEach((listener) => {
        try {
          listener(eventWithId);
        } catch (e) {
          console.error("Event listener error:", e);
        }
      });
    }
  }

  clearRun(runId: string): void {
    this.listeners.delete(runId);
  }
}

export const eventBus = new EventBus();
