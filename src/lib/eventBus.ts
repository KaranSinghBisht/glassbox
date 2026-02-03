import { SwarmEvent } from "./schemas";

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
    this.globalListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (e) {
        console.error("Event listener error:", e);
      }
    });

    const runListeners = this.listeners.get(event.runId);
    if (runListeners) {
      runListeners.forEach((listener) => {
        try {
          listener(event);
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
