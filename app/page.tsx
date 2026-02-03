"use client";

import { useState, useCallback, useRef } from "react";
import SwarmGraph, { AgentStatus } from "@/components/SwarmGraph";
import { useSwarmEvents } from "@/components/SwarmEventBridge";

interface Message {
  id: string;
  type: string;
  content: string;
  timestamp: Date;
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [runId, setRunId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState(false);

  const graphRef = useRef<{
    addAgent: (id: string, label: string, role: string, parentId?: string) => void;
    updateAgentStatus: (agentId: string, status: AgentStatus) => void;
  } | null>(null);

  const addMessage = useCallback((type: string, content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type, content, timestamp: new Date() },
    ]);
  }, []);

  useSwarmEvents({
    runId: runId ?? undefined,
    onConnected: () => {
      setConnected(true);
      addMessage("system", "Connected to event stream");
    },
    onDisconnected: () => {
      setConnected(false);
      addMessage("system", "Disconnected from event stream");
    },
    onAgentSpawned: (agentId, name, role, parentId) => {
      addMessage("agent", `${name} (${role}) spawned`);
    },
    onAgentStatusChange: (agentId, status) => {
      addMessage("status", `Agent ${agentId.slice(0, 8)} → ${status}`);
    },
    onArtifactCreated: (artifactId, name, agentId) => {
      addMessage("artifact", `Created: ${name}`);
    },
    onApprovalRequired: (proposalId, actionId, title) => {
      addMessage("approval", `Approval needed: ${title}`);
    },
    onError: (error) => {
      addMessage("error", error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setMessages([]);

    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to start run");
      }

      const { runId: newRunId } = await response.json();
      setRunId(newRunId);
      addMessage("system", `Run started: ${newRunId.slice(0, 8)}...`);
    } catch (error) {
      addMessage("error", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
            G
          </div>
          <h1 className="text-xl font-semibold">GlassBox</h1>
          <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-400">
            Mission Control
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-green-500" : "bg-slate-500"
            }`}
          />
          <span className="text-sm text-slate-400">
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="px-6 py-4 border-b border-slate-700">
        <div className="flex gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What would you like the swarm to do?"
            className="flex-1 px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Starting..." : "Start Run"}
          </button>
        </div>
      </form>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-3/5 border-r border-slate-700 bg-slate-850">
          <SwarmGraph className="bg-slate-800" />
        </div>

        <div className="w-2/5 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-700 bg-slate-800">
            <h2 className="font-semibold text-sm text-slate-300">Event Log</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.length === 0 ? (
              <div className="text-center text-slate-500 py-12 animate-fade-in">
                <div className="text-4xl mb-3">🔮</div>
                <p className="font-medium">No events yet</p>
                <p className="text-sm mt-1">Start a run to see agent activity</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`px-3 py-2 rounded-lg text-sm animate-slide-in ${
                    msg.type === "error"
                      ? "bg-red-900/30 border border-red-800 text-red-300"
                      : msg.type === "system"
                      ? "bg-slate-700/50 text-slate-400"
                      : msg.type === "approval"
                      ? "bg-yellow-900/30 border border-yellow-800 text-yellow-300"
                      : msg.type === "artifact"
                      ? "bg-green-900/30 border border-green-800 text-green-300"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{msg.type}</span>
                    <span className="text-xs text-slate-500">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="mt-1">{msg.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
