"use client";

import { useState, useEffect, useRef } from "react";
import { SwarmEvent, TEventType } from "@/lib/schemas";
import ActionProposalCard from "./tambo/ActionProposalCard";
import ArtifactViewer from "./tambo/ArtifactViewer";
import AgentMessageCard from "./tambo/AgentMessageCard";
import ErrorCard from "./tambo/ErrorCard";
import { Card, Badge, cn } from "@/components/ui/primitives";
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  User,
  ShieldCheck,
  Rocket,
} from "lucide-react";

interface TamboConsoleProps {
  events: SwarmEvent[];
}

type ApprovalState = "pending" | "approved" | "rejected";

const roleIcons: Record<string, string> = {
  orchestrator: "🎯",
  researcher: "🔍",
  builder: "🔨",
  auditor: "🛡️",
};

const statusConfig: Record<string, { color: string; icon: typeof Loader2; label: string }> = {
  thinking: { color: "text-blue-400", icon: Loader2, label: "Thinking" },
  acting: { color: "text-violet-400", icon: Zap, label: "Acting" },
  waiting: { color: "text-amber-400", icon: AlertTriangle, label: "Awaiting Approval" },
  done: { color: "text-emerald-400", icon: CheckCircle2, label: "Done" },
  error: { color: "text-red-400", icon: AlertTriangle, label: "Error" },
  idle: { color: "text-slate-400", icon: User, label: "Idle" },
  blocked: { color: "text-orange-400", icon: AlertTriangle, label: "Blocked" },
  escalated: { color: "text-pink-400", icon: AlertTriangle, label: "Escalated" },
  rejected: { color: "text-rose-400", icon: AlertTriangle, label: "Rejected" },
};

function AgentSpawnCard({ name, role }: { name: string; role: string }) {
  const icon = roleIcons[role] || "🤖";
  return (
    <Card className="p-3 border-blue-500/20 bg-blue-950/20 animate-slide-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-200">{name}</span>
            <Badge variant="default" className="text-[10px]">{role}</Badge>
          </div>
          <span className="text-xs text-blue-400">Agent spawned</span>
        </div>
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
      </div>
    </Card>
  );
}

function AgentStatusCard({ status, agentId }: { status: string; agentId?: string }) {
  const config = statusConfig[status] || statusConfig.idle;
  const Icon = config.icon;
  const isThinking = status === "thinking";

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/50 border border-white/5 animate-slide-in">
      <Icon className={cn("w-4 h-4", config.color, isThinking && "animate-spin")} />
      <span className={cn("text-xs font-medium", config.color)}>{config.label}</span>
      {agentId && (
        <span className="text-[10px] text-slate-600 font-mono ml-auto">{agentId.slice(0, 8)}</span>
      )}
    </div>
  );
}

function AgentProgressCard({ progress, percentage }: { progress: string; percentage?: number; step?: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-900/50 border border-white/5 animate-slide-in">
      <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-300 truncate">{progress}</p>
        {percentage !== undefined && (
          <div className="mt-1 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>
      {percentage !== undefined && (
        <span className="text-[10px] font-mono text-blue-300 shrink-0">{percentage}%</span>
      )}
    </div>
  );
}

function RunCreatedCard({ prompt }: { prompt: string }) {
  return (
    <Card className="p-4 border-indigo-500/20 bg-indigo-950/20 animate-slide-in">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Rocket className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="flex-1">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Mission Started</span>
          <p className="text-sm text-slate-300 mt-1 leading-relaxed">{prompt}</p>
        </div>
      </div>
    </Card>
  );
}

function RunCompletedCard({ status, summary }: { status: string; summary?: string }) {
  const isSuccess = status === "success";
  return (
    <Card className={cn(
      "p-4 animate-slide-in",
      isSuccess ? "border-emerald-500/20 bg-emerald-950/20" : "border-red-500/20 bg-red-950/20"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg border flex items-center justify-center",
          isSuccess ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"
        )}>
          {isSuccess ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400" />
          )}
        </div>
        <div className="flex-1">
          <span className={cn(
            "text-xs font-bold uppercase tracking-wider",
            isSuccess ? "text-emerald-400" : "text-red-400"
          )}>
            {isSuccess ? "Mission Complete" : "Mission Failed"}
          </span>
          {summary && (
            <p className="text-sm text-slate-400 mt-1">{summary}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

const RENDERABLE_EVENTS = new Set<string>([
  "RUN_CREATED",
  "AGENT_SPAWNED",
  "AGENT_STATUS",
  "AGENT_PROGRESS",
  "AGENT_MESSAGE",
  "ARTIFACT_CREATED",
  "APPROVAL_REQUIRED",
  "RUN_COMPLETED",
  "ERROR",
]);

export default function TamboConsole({ events }: TamboConsoleProps) {
  const [approvalStates, setApprovalStates] = useState<Record<string, ApprovalState>>({});
  const prevEventsLengthRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (events.length === 0 && prevEventsLengthRef.current > 0) {
      setApprovalStates({});
    }
    prevEventsLengthRef.current = events.length;
  }, [events.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  const handleApprove = async (proposalId: string) => {
    const response = await fetch(`/api/proposals/${proposalId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Failed to approve");
    }
    setApprovalStates(prev => ({ ...prev, [proposalId]: "approved" }));
  };

  const handleReject = async (proposalId: string) => {
    const response = await fetch(`/api/proposals/${proposalId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Rejected by user" }),
    });

    if (!response.ok) {
      throw new Error("Failed to reject");
    }
    setApprovalStates(prev => ({ ...prev, [proposalId]: "rejected" }));
  };

  const renderableEvents = events.filter(e => RENDERABLE_EVENTS.has(e.type));

  if (renderableEvents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <div className="text-4xl mb-3">🎯</div>
          <p className="font-medium">Waiting for mission</p>
          <p className="text-sm mt-1">Agent activity will appear here in real-time</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="space-y-3 overflow-y-auto">
      {renderableEvents.map((event, index) => {
        const key = `${event.type}-${index}-${event.ts}`;
        const eventType = event.type as TEventType;

        switch (eventType) {
          case "RUN_CREATED": {
            const payload = event.payload as { prompt: string };
            return <RunCreatedCard key={key} prompt={payload.prompt} />;
          }

          case "AGENT_SPAWNED": {
            const payload = event.payload as { name: string; role: string; parentId?: string };
            return <AgentSpawnCard key={key} name={payload.name} role={payload.role} />;
          }

          case "AGENT_STATUS": {
            const payload = event.payload as { status: string; message?: string };
            return <AgentStatusCard key={key} status={payload.status} agentId={event.agentId} />;
          }

          case "AGENT_PROGRESS": {
            const payload = event.payload as { progress: string; percentage?: number; step?: string };
            return <AgentProgressCard key={key} progress={payload.progress} percentage={payload.percentage} step={payload.step} />;
          }

          case "AGENT_MESSAGE": {
            const payload = event.payload as { summary: string; to?: string; dataRef?: string };
            return <AgentMessageCard key={key} data={payload} />;
          }

          case "ARTIFACT_CREATED": {
            const payload = event.payload as {
              artifactId: string;
              name: string;
              contentType?: string;
              contentPreview: string;
            };
            return (
              <ArtifactViewer
                key={key}
                data={{
                  id: payload.artifactId,
                  name: payload.name,
                  agentId: event.agentId || "unknown",
                  content: payload.contentPreview || "",
                  contentType: payload.contentType,
                  createdAt: new Date(event.ts).toISOString(),
                }}
              />
            );
          }

          case "APPROVAL_REQUIRED": {
            const payload = event.payload as {
              proposalId: string;
              actionId: string;
              kind: string;
              title: string;
              risk: "low" | "medium" | "high" | "critical";
            };

            const state = approvalStates[payload.proposalId];
            if (state === "approved" || state === "rejected") {
              return (
                <div key={key} className={cn(
                  "p-4 rounded-lg border animate-slide-in",
                  state === "approved"
                    ? "bg-emerald-900/30 border-emerald-800 text-emerald-300"
                    : "bg-red-900/30 border-red-800 text-red-300"
                )}>
                  <span className="font-medium">
                    {state === "approved" ? "Approved" : "Rejected"}: {payload.title}
                  </span>
                </div>
              );
            }

            return (
              <ActionProposalCard
                key={key}
                data={{
                  proposalId: payload.proposalId,
                  actionId: payload.actionId,
                  kind: payload.kind as "write_artifact" | "propose_patch" | "apply_patch" | "export_report" | "execute_code",
                  title: payload.title,
                  risk: payload.risk,
                  rationale: "Awaiting your approval",
                  description: "",
                  preview: { type: "none" },
                  requiresApproval: true,
                }}
                onApprove={() => handleApprove(payload.proposalId)}
                onReject={() => handleReject(payload.proposalId)}
              />
            );
          }

          case "RUN_COMPLETED": {
            const payload = event.payload as { status: string; summary?: string };
            return <RunCompletedCard key={key} status={payload.status} summary={payload.summary} />;
          }

          case "ERROR": {
            const payload = event.payload as { code?: string; message: string; stack?: string };
            return <ErrorCard key={key} data={payload} />;
          }

          default:
            return null;
        }
      })}
    </div>
  );
}
