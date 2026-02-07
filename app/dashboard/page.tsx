"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SwarmGraph, { AgentStatus, SwarmGraphHandle } from "@/components/SwarmGraph";
import { useSwarmEvents } from "@/components/SwarmEventBridge";
import { SwarmEvent } from "@/lib/schemas";
import { Button, Badge, cn } from "@/components/ui/primitives";
import {
  RotateCcw,
  Box,
  Zap,
  Terminal,
  Cpu,
  Check,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  FileText,
  Timer,
  ArrowRight,
  Loader2,
  Send,
} from "lucide-react";
import { LogoutButton } from "@/components/AuthProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const SAMPLE_MISSIONS = [
  { emoji: "📱", title: "Mobile App PRD", prompt: "Create a PRD for a mobile app that helps users find and book dog-friendly restaurants near them" },
  { emoji: "🛒", title: "E-commerce Feature", prompt: "Create a PRD for adding a real-time collaborative shopping cart with live cursors to an e-commerce platform" },
  { emoji: "🏥", title: "HealthTech Platform", prompt: "Create a PRD for a telemedicine platform that connects patients with specialists via AI-triaged video consultations" },
  { emoji: "🎓", title: "EdTech Tool", prompt: "Create a PRD for an AI-powered learning platform that adapts lesson difficulty based on student performance" },
];

interface AgentInfo {
  id: string;
  name: string;
  role: string;
  status: string;
}

interface Artifact {
  id: string;
  name: string;
  content: string;
  contentType?: string;
}

function ArtifactBlock({ name, content, contentType }: { name: string; content: string; contentType?: string }) {
  const [expanded, setExpanded] = useState(false);
  const isCode = contentType?.includes("json") || contentType?.includes("javascript") || contentType?.includes("typescript");
  const isMarkdown = contentType?.includes("markdown") || content.includes("## ") || content.includes("# ");
  
  const lines = content.split("\n");
  const previewLines = lines.slice(0, 8);

  const getPlainPreview = (text: string) => {
    return text
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/>\s/g, '')
      .replace(/[-*]\s/g, '  ')
      .split('\n')
      .filter(line => line.trim())
      .slice(0, 4)
      .join('\n');
  };

  return (
    <div className="my-2 ml-3 max-w-[95%] animate-slide-in">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors w-full group"
      >
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <FileText className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-medium text-emerald-300">{name}</span>
        <span className="text-slate-600 text-[10px]">{lines.length} lines</span>
      </button>
      {expanded && (
        <div className="mt-1 ml-5 bg-slate-900/80 border border-white/5 rounded-lg overflow-hidden">
          {isMarkdown ? (
            <div className="p-4 max-h-[500px] overflow-y-auto scrollbar-thin text-sm text-slate-300 leading-relaxed [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-slate-100 [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-200 [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-300 [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-3 [&_p]:text-slate-400 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:text-slate-400 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:text-slate-400 [&_li]:mb-1 [&_strong]:text-slate-200 [&_strong]:font-semibold [&_blockquote]:border-l-2 [&_blockquote]:border-blue-500/30 [&_blockquote]:pl-4 [&_blockquote]:text-slate-500 [&_blockquote]:italic [&_blockquote]:my-3 [&_code]:bg-slate-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:text-blue-300 [&_pre]:bg-slate-900 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-3 [&_table]:w-full [&_table]:text-xs [&_th]:text-left [&_th]:text-slate-300 [&_th]:border-b [&_th]:border-slate-700 [&_th]:pb-2 [&_th]:pr-4 [&_td]:text-slate-400 [&_td]:border-b [&_td]:border-slate-800 [&_td]:py-2 [&_td]:pr-4 [&_hr]:border-slate-800 [&_hr]:my-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <pre className="p-3 text-xs text-slate-400 overflow-x-auto font-mono leading-relaxed max-h-[300px] overflow-y-auto scrollbar-thin">
              {content}
            </pre>
          )}
        </div>
      )}
      {!expanded && (
        <div className="mt-1 ml-5 bg-slate-900/50 border border-white/5 rounded-lg overflow-hidden">
          {isMarkdown ? (
            <div className="px-3 py-2 text-sm text-slate-500 leading-relaxed">
              {getPlainPreview(content)}
            </div>
          ) : (
            <pre className="px-3 py-2 text-[11px] text-slate-600 overflow-hidden font-mono leading-relaxed">
              {previewLines.join("\n")}{lines.length > 8 ? "\n..." : ""}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [prompt, setPrompt] = useState("");
  const [runId, setRunId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<SwarmEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [runStatus, setRunStatus] = useState<string>("pending");
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);

  const [runStartTime, setRunStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const graphRef = useRef<SwarmGraphHandle>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [events, artifacts]);

  useEffect(() => {
    if (runStatus !== "running" || !runStartTime) return;
    const timer = setInterval(() => setElapsedTime(Date.now() - runStartTime), 100);
    return () => clearInterval(timer);
  }, [runStatus, runStartTime]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        (document.activeElement as HTMLElement)?.blur();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const fetchArtifacts = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/run/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.artifacts?.length) {
        setArtifacts(data.artifacts.map((a: { id: string; name: string; content: string; contentType?: string }) => ({
          id: a.id,
          name: a.name,
          content: a.content,
          contentType: a.contentType,
        })));
      }
    } catch {}
  }, []);

  const seenEventIds = useRef<Set<string>>(new Set());
  const seenAgentIdsRef = useRef<Set<string>>(new Set());

  const addEvent = useCallback((event: SwarmEvent) => {
    const eventId = event.id || `${event.type}-${event.ts}-${event.agentId || ""}`;
    if (seenEventIds.current.has(eventId)) return;
    seenEventIds.current.add(eventId);
    setEvents((prev) => [...prev, event]);
  }, []);

  const handleConnected = useCallback(() => setConnected(true), []);
  const handleDisconnected = useCallback(() => setConnected(false), []);

  const handleAgentSpawned = useCallback((agentId: string, name: string, role: string, parentId?: string) => {
    if (seenAgentIdsRef.current.has(agentId)) return;
    seenAgentIdsRef.current.add(agentId);
    graphRef.current?.addAgent(agentId, role, parentId);
    setAgents((prev) => [...prev, { id: agentId, name, role, status: "idle" }]);
  }, []);

  const handleAgentStatusChange = useCallback((agentId: string, status: string) => {
    graphRef.current?.updateAgentStatus(agentId, status as AgentStatus);
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status } : a));
  }, []);

  const handleRunCompleted = useCallback((status: string) => {
    setRunStatus(status === "success" ? "completed" : "failed");
  }, []);

  useSwarmEvents({
    runId: runId ?? undefined,
    onConnected: handleConnected,
    onDisconnected: handleDisconnected,
    onAgentSpawned: handleAgentSpawned,
    onAgentStatusChange: handleAgentStatusChange,
    onArtifactCreated: useCallback(() => {}, []),
    onApprovalRequired: useCallback(() => {}, []),
    onError: useCallback(() => {}, []),
    onRunCompleted: handleRunCompleted,
    onRawEvent: addEvent,
  });

  useEffect(() => {
    if ((runStatus === "completed" || runStatus === "failed") && runId) {
      fetchArtifacts(runId);
      inputRef.current?.focus();
    }
  }, [runStatus, runId, fetchArtifacts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    if (runId && (runStatus === "completed" || runStatus === "failed")) {
      setRunId(null);
      setArtifacts([]);
    }

    setIsLoading(true);
    setEvents([]);
    setAgents([]);
    seenEventIds.current.clear();
    seenAgentIdsRef.current.clear();
    setRunStatus("running");
    setRunStartTime(Date.now());
    setElapsedTime(0);
    setArtifacts([]);
    graphRef.current?.resetGraph();

    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error("Failed to start run");

      const { runId: newRunId } = await response.json();
      setRunId(newRunId);
      setPrompt("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setEvents(prev => [...prev, {
        id: crypto.randomUUID(),
        type: "ERROR",
        payload: { message },
        ts: Date.now(),
        runId: "error",
      }]);
      setRunStatus("pending");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = useCallback(() => {
    setRunId(null);
    setEvents([]);
    setAgents([]);
    setPrompt("");
    setRunStatus("pending");
    setRunStartTime(null);
    setElapsedTime(0);
    setArtifacts([]);
    seenEventIds.current.clear();
    seenAgentIdsRef.current.clear();
    graphRef.current?.resetGraph();
  }, []);

  const renderEvent = (event: SwarmEvent) => {
    const { type, payload, agentId } = event;
    const agent = agents.find(a => a.id === agentId);
    const agentName = agent?.name || agentId?.slice(0, 8) || "System";

    switch (type) {
      case "RUN_CREATED":
        return (
          <div className="py-3 mb-3">
            <div className="flex items-center gap-2 text-slate-200">
              <Send className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium">{payload.prompt}</span>
            </div>
          </div>
        );

      case "AGENT_SPAWNED":
        return (
          <div className="flex items-center gap-2 py-1 text-sm border-l-2 border-blue-500/30 pl-3 my-1 animate-slide-in">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">
              <span className="text-blue-300 font-medium">{payload.name}</span>
              <span className="text-slate-600"> joined as {payload.role}</span>
            </span>
          </div>
        );

      case "AGENT_STATUS": {
        if (payload.status === "idle" || payload.status === "waiting") return null;
        const statusMap: Record<string, { text: string; color: string }> = {
          thinking: { text: "thinking...", color: "text-blue-400" },
          acting: { text: "working...", color: "text-violet-400" },
          done: { text: "done", color: "text-emerald-400" },
          error: { text: "error", color: "text-red-400" },
        };
        const s = statusMap[payload.status];
        if (!s) return null;
        return (
          <div className="flex items-center gap-2 py-0.5 text-xs pl-4 my-0.5 animate-slide-in font-mono">
            {payload.status === "thinking" ? (
              <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
            ) : payload.status === "done" ? (
              <Check className="w-3 h-3 text-emerald-500" />
            ) : (
              <ArrowRight className="w-3 h-3 text-slate-600" />
            )}
            <span className="text-slate-500">{agentName}</span>
            <span className={s.color}>{s.text}</span>
          </div>
        );
      }

      case "AGENT_PROGRESS": {
        const pct = payload.percentage;
        return (
          <div className="flex items-center gap-2 py-0.5 text-xs pl-4 my-0.5 animate-slide-in font-mono">
            <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
            <span className="text-slate-500 truncate">{payload.progress}</span>
            {pct !== undefined && <span className="text-blue-400 shrink-0">{pct}%</span>}
          </div>
        );
      }

      case "AGENT_MESSAGE":
        return (
          <div className="ml-3 my-2 animate-slide-in">
            <div className="text-[10px] text-slate-500 mb-1 font-mono flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {agentName}
            </div>
            <div className="bg-slate-900/60 border border-white/5 rounded-lg px-3 py-2 text-sm text-slate-300 leading-relaxed max-w-[95%]">
              {payload.summary}
            </div>
          </div>
        );

      case "ARTIFACT_CREATED":
        return (
          <div className="flex items-center gap-2 py-0.5 text-xs pl-4 my-0.5 animate-slide-in font-mono">
            <FileText className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-300">{payload.name}</span>
          </div>
        );

      case "APPROVAL_REQUIRED":
        return (
          <div className="flex items-center gap-2 py-0.5 text-xs pl-4 my-0.5 animate-slide-in font-mono">
            <Check className="w-3 h-3 text-amber-400" />
            <span className="text-amber-300/70">auto-approved: {payload.title}</span>
          </div>
        );

      case "RUN_COMPLETED": {
        const ok = payload.status === "success";
        return (
          <div className={cn(
            "my-4 p-3 rounded-lg border flex items-center gap-3 animate-slide-in",
            ok ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"
          )}>
            {ok ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
            <span className={cn("text-sm font-medium", ok ? "text-emerald-400" : "text-red-400")}>
              {ok ? "Done" : "Failed"} — {payload.summary || (ok ? "all tasks completed" : "encountered an error")}
            </span>
          </div>
        );
      }

      case "ERROR":
        return (
          <div className="ml-3 my-2 flex items-start gap-2 text-red-400 text-xs animate-slide-in bg-red-500/5 p-2 rounded border border-red-500/10">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span className="font-mono">{payload.message}</span>
          </div>
        );

      default:
        return null;
    }
  };

  const isRunDone = runStatus === "completed" || runStatus === "failed";

  return (
    <div className="h-screen w-full flex flex-col bg-slate-950 text-slate-200 overflow-hidden">
      <header className="h-11 border-b border-white/5 bg-slate-950 flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-bold text-sm tracking-tight hover:opacity-80 transition-opacity">
            <div className="w-5 h-5 bg-gradient-to-tr from-blue-600 to-violet-600 rounded flex items-center justify-center">
              <Box className="w-3 h-3 text-white" />
            </div>
            <span className="text-slate-200">GlassBox</span>
          </Link>
          <Badge variant={connected ? "success" : "default"} className="h-5 gap-1 px-2 text-[10px]">
            <div className={cn("w-1.5 h-1.5 rounded-full", connected ? "bg-emerald-400 animate-pulse" : "bg-slate-600")} />
            {connected ? "LIVE" : "OFF"}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          {runId && runStatus === "running" && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
              <Timer className="w-3 h-3 text-blue-400 animate-pulse" />
              <span className="text-xs font-mono text-blue-300 tabular-nums">{(elapsedTime / 1000).toFixed(1)}s</span>
            </div>
          )}
          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="w-full lg:w-[55%] flex flex-col min-h-0">
          <div ref={feedRef} className="flex-1 overflow-y-auto px-4 pt-4 pb-2">
            {events.length === 0 && !runId ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600">
                <Terminal className="w-10 h-10 mb-3 text-slate-800" />
                <p className="text-sm font-mono text-slate-600">What would you like the swarm to do?</p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto">
                {events.map((event) => {
                  const el = renderEvent(event);
                  return el ? <div key={event.id || `${event.type}-${event.ts}`}>{el}</div> : null;
                })}

                {runStatus === "running" && (
                  <div className="flex items-center gap-2 text-slate-500 text-xs pl-4 mt-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="font-mono">agents working...</span>
                  </div>
                )}

                {isRunDone && artifacts.length > 0 && (
                  <div className="mt-4 border-t border-white/5 pt-4">
                    <div className="text-xs font-mono text-slate-500 mb-3 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" />
                      OUTPUT — {artifacts.length} artifact{artifacts.length > 1 ? "s" : ""}
                    </div>
                    {artifacts.map((a) => (
                      <ArtifactBlock key={a.id} name={a.name} content={a.content} contentType={a.contentType} />
                    ))}
                  </div>
                )}

                {isRunDone && (
                  <div className="mt-4 mb-2 text-xs text-slate-500 font-mono text-center">
                    Type a follow-up or <button onClick={handleReset} className="text-blue-400 hover:underline">start fresh</button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="shrink-0 px-4 py-3 border-t border-white/5 bg-slate-950">
            {!runId && !isRunDone && (
              <div className="mb-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none max-w-2xl mx-auto">
                {SAMPLE_MISSIONS.map((m) => (
                  <button
                    key={m.title}
                    onClick={() => setPrompt(m.prompt)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all text-xs text-slate-400 hover:text-blue-300"
                  >
                    <span>{m.emoji}</span> {m.title}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
              <div className="relative flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={runStatus === "running" ? "Swarm is working..." : isRunDone ? "Ask a follow-up..." : "What should the swarm do? (⌘K)"}
                  disabled={runStatus === "running" || isLoading}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-4 pr-20 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-slate-600 disabled:opacity-40 text-slate-200"
                />
                <div className="absolute right-2">
                  {runStatus === "running" ? (
                    <Button type="button" variant="destructive" size="sm" onClick={() => { if (runId) fetch(`/api/run/${runId}`, { method: "DELETE" }).then(() => setRunStatus("failed")).catch(() => {}); }} className="h-7 text-xs px-3">
                      Stop
                    </Button>
                  ) : (
                    <Button type="submit" disabled={!prompt.trim() || isLoading} size="sm" className="h-7 text-xs px-3 bg-blue-600 hover:bg-blue-500 text-white border-none">
                      {isRunDone ? "Run again" : "Run"} <span className="ml-1 opacity-50 text-[10px]">↵</span>
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="hidden lg:flex lg:w-[45%] border-l border-white/5 flex-col relative">
          <div className="absolute top-3 left-4 z-10 pointer-events-none">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> Agent Mesh
            </span>
          </div>

          <ErrorBoundary fallbackTitle="Graph error">
            <div className="flex-1">
              <SwarmGraph ref={graphRef} className="bg-slate-950" />
            </div>
          </ErrorBoundary>

          {!runId && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none bg-slate-950/40">
              <div className="text-center opacity-40">
                <Cpu className="w-10 h-10 mx-auto mb-2 text-slate-700" />
                <p className="text-[11px] text-slate-600 font-mono">agents idle</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
