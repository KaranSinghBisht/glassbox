import { SwarmEvent } from './schemas';

type EventListener = (event: SwarmEvent) => void;

class EventBus {
  private listeners: Map<string, Set<EventListener>> = new Map();
  private globalListeners: Set<EventListener> = new Set();

  // Subscribe to all events
  subscribe(listener: EventListener): () => void {
    this.globalListeners.add(listener);
    return () => this.globalListeners.delete(listener);
  }

  // Subscribe to events for a specific run
  subscribeToRun(runId: string, listener: EventListener): () => void {
    if (!this.listeners.has(runId)) {
      this.listeners.set(runId, new Set());
    }
    this.listeners.get(runId)!.add(listener);
    return () => this.listeners.get(runId)?.delete(listener);
  }

  // Emit an event
  emit(event: SwarmEvent): void {
    // Notify global listeners
    this.globalListeners.forEach(listener => {
      try {
        listener(event);
      } catch (e) {
        console.error('Event listener error:', e);
      }
    });

    // Notify run-specific listeners
    const runListeners = this.listeners.get(event.runId);
    if (runListeners) {
      runListeners.forEach(listener => {
        try {
          listener(event);
        } catch (e) {
          console.error('Event listener error:', e);
        }
      });
    }
  }

  // Clear listeners for a specific run
  clearRun(runId: string): void {
    this.listeners.delete(runId);
  }
}

// Singleton instance
export const eventBus = new EventBus();
