"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import SwarmGraph, { AgentStatus, SwarmGraphHandle } from "@/components/SwarmGraph";
import { useSwarmEvents } from "@/components/SwarmEventBridge";
import TamboConsole from "@/components/TamboConsole";
import TamboThread from "@/components/TamboThread";
import LLMMetrics from "@/components/ui/LLMMetrics";
import AgentStatusPanel from "@/components/AgentStatusPanel";
import { SwarmEvent } from "@/lib/schemas";
import { Button, Badge, Tabs } from "@/components/ui/primitives";
import { cn } from "@/components/ui/primitives";
import {
  Play,
  RotateCcw,
  Box,
  Zap,
  Settings,
  Activity,
  Command,
  MessageSquare,
  Download,
} from "lucide-react";

interface Message {
  id: string;
  type: string;
  content: string;
  timestamp: Date;
}

interface Metrics {
  inputTokens: number;
  outputTokens: number;
  calls: number;
  estimatedCost: number;
}

interface AgentInfo {
  id: string;
  name: string;
  role: string;
  status: string;
  progress?: number;
  lastMessage?: string;
}

export default function Dashboard() {
  const [prompt, setPrompt] = useState("");
  const [runId, setRunId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [events, setEvents] = useState<SwarmEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [activeTab, setActiveTab] = useState("Generative");
  const [metrics, setMetrics] = useState<Metrics>({ inputTokens: 0, outputTokens: 0, calls: 0, estimatedCost: 0 });
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [runStatus, setRunStatus] = useState<string>("pending");

  const graphRef = useRef<SwarmGraphHandle>(null);
  
  useEffect(() => {
    if (!runId) return;
    
    const pollMetrics = async () => {
      try {
        const res = await fetch("/api/metrics");
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch {
      }
    };
    
    pollMetrics();
    const interval = setInterval(pollMetrics, 2000);
    return () => clearInterval(interval);
  }, [runId]);

  const addMessage = useCallback((type: string, content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type, content, timestamp: new Date() },
    ]);
  }, []);

  const seenEventIds = useRef<Set<string>>(new Set());
  
  const addEvent = useCallback((event: SwarmEvent) => {
    const eventId = event.id || `${event.type}-${event.ts}`;
    if (seenEventIds.current.has(eventId)) return;
    seenEventIds.current.add(eventId);
    setEvents((prev) => [...prev, event]);
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
      graphRef.current?.addAgent(agentId, role, parentId);
      setAgents(prev => [...prev, { id: agentId, name, role, status: "idle" }]);
    },
    onAgentStatusChange: (agentId, status) => {
      addMessage("status", `Agent ${agentId.slice(0, 8)} → ${status}`);
      graphRef.current?.updateAgentStatus(agentId, status as AgentStatus);
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status } : a));
    },
    onArtifactCreated: (artifactId, name) => {
      addMessage("artifact", `Created: ${name}`);
    },
    onApprovalRequired: (proposalId, actionId, title) => {
      addMessage("approval", `Approval needed: ${title}`);
    },
    onError: (error) => {
      addMessage("error", error.message);
    },
    onRunCompleted: (status) => {
      setRunStatus(status === "success" ? "completed" : "failed");
      addMessage("system", `Run ${status === "success" ? "completed successfully" : "failed"}`);
    },
    onRawEvent: addEvent,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setMessages([]);
    setEvents([]);
    setAgents([]);
    setMetrics({ inputTokens: 0, outputTokens: 0, calls: 0, estimatedCost: 0 });
    setRunStatus("running");
    
    await fetch("/api/metrics", { method: "DELETE" }).catch(() => {});

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

  const handleReset = () => {
    setRunId(null);
    setMessages([]);
    setEvents([]);
    setAgents([]);
    setPrompt("");
    setRunStatus("pending");
  };

  const handleExport = () => {
    if (runId) {
      window.open(`/api/run/${runId}/export`, "_blank");
    }
  };

  const handleAgentClick = (agentId: string) => {
    console.log("Focus agent:", agentId);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-950 text-slate-200 overflow-hidden">
      <header className="h-14 border-b border-white/5 bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 bg-gradient-to-tr from-blue-500 to-violet-500 rounded-md flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Box className="w-4 h-4 text-white" />
            </div>
            GlassBox
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <span className="text-sm font-medium text-slate-400">Mission Control</span>
        </div>

        <div className="flex items-center gap-4">
          {runId && metrics.calls > 0 && (
            <LLMMetrics
              inputTokens={metrics.inputTokens}
              outputTokens={metrics.outputTokens}
              calls={metrics.calls}
              estimatedCost={metrics.estimatedCost}
            />
          )}
          <Badge variant={connected ? "success" : "default"} className="gap-1.5 transition-all">
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                connected ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
              )}
            />
            {connected ? "LIVE" : "OFFLINE"}
          </Badge>
          {runId && (
            <div className="font-mono text-xs text-slate-500">
              RUN: {runId.slice(0, 8)}
            </div>
          )}
        </div>
      </header>

      <form onSubmit={handleSubmit} className="h-16 border-b border-white/5 bg-slate-900/20 flex items-center px-6 gap-4 shrink-0">
        <div className="flex-1 relative">
          <Command className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the mission for the swarm..."
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-slate-600"
            disabled={isLoading}
          />
        </div>
        <div className="flex items-center gap-2">
          {!runId ? (
            <Button type="submit" disabled={isLoading || !prompt.trim()} className="gap-2">
              <Play className="w-4 h-4 fill-current" />
              {isLoading ? "Initializing..." : "Initialize Swarm"}
            </Button>
          ) : (
            <>
              {(runStatus === "completed" || runStatus === "failed") && (
                <Button type="button" variant="secondary" onClick={handleExport} className="gap-2">
                  <Download className="w-4 h-4" /> Export
                </Button>
              )}
              <Button type="button" variant="destructive" onClick={handleReset} className="gap-2">
                <RotateCcw className="w-4 h-4" /> Reset
              </Button>
            </>
          )}
        </div>
      </form>

      <main className="flex-1 grid grid-cols-12 overflow-hidden">
        <div className="col-span-12 lg:col-span-6 border-r border-white/5 relative flex flex-col">
          <div className="absolute top-4 left-4 z-10">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" /> Real-time Mesh
            </h2>
          </div>
          <div className="flex-[3]">
            <SwarmGraph ref={graphRef} className="bg-slate-950" />
          </div>
          <div className="flex-[2] border-t border-white/5 min-h-0">
            <AgentStatusPanel agents={agents} onAgentClick={handleAgentClick} />
          </div>
        </div>

        <div className="col-span-12 md:col-span-6 lg:col-span-3 border-r border-white/5 flex flex-col bg-slate-900/10">
          <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-slate-950/50">
            <h2 className="text-sm font-semibold text-slate-300">Generative Output</h2>
            <Tabs options={["Generative", "Console"]} active={activeTab} onChange={setActiveTab} />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {activeTab === "Generative" ? (
              <TamboThread />
            ) : (
              <TamboConsole events={events} />
            )}
          </div>
        </div>

        <div className="col-span-12 md:col-span-6 lg:col-span-3 flex flex-col bg-slate-950">
          <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-slate-950/50">
            <h2 className="text-sm font-semibold text-slate-300">Event Timeline</h2>
            <Button variant="ghost" size="sm">
              <Settings className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="p-8 text-center">
                <Zap className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                <p className="text-xs text-slate-600">No events recorded.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {messages.map((msg, idx) => (
                  <div
                    key={msg.id}
                    className="group flex gap-3 p-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer relative"
                  >
                    <div className="absolute left-[19px] top-8 bottom-[-20px] w-px bg-white/5" />
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 border border-slate-800 bg-slate-900",
                        msg.type === "error" && "text-red-500 border-red-900",
                        msg.type === "approval" && "text-amber-500 border-amber-900",
                        msg.type === "artifact" && "text-emerald-500 border-emerald-900",
                        msg.type === "agent" && "text-blue-500 border-blue-900",
                        msg.type === "system" && "text-slate-500"
                      )}
                    >
                      <MessageSquare className="w-3 h-3" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-slate-300 capitalize">
                          {msg.type}
                        </span>
                        <span className="text-[10px] text-slate-600 font-mono">
                          {msg.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                        {msg.content}
                      </p>
                      {msg.type === "approval" && (
                        <div className="mt-2">
                          <Badge variant="warning">Action Required</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
