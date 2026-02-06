"use client";

import { RunProgressCard as RunProgressCardType } from "@/lib/schemas";
import { useTamboStreamStatus } from "@tambo-ai/react";
import { Card, Badge, Progress, cn } from "@/components/ui/primitives";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

export interface RunProgressCardProps {
  data: RunProgressCardType;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

const statusIcons: Record<string, typeof Loader2> = {
  pending: Clock,
  running: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
};

const statusColors: Record<string, string> = {
  pending: "text-slate-400",
  running: "text-blue-400",
  completed: "text-emerald-400",
  failed: "text-red-400",
};

export default function RunProgressCard({ data }: RunProgressCardProps) {
  const { streamStatus } = useTamboStreamStatus<RunProgressCardType>();

  if (streamStatus.isPending) {
    return (
      <Card className="p-4 animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-1/3 mb-3" />
        <div className="h-2 bg-slate-800 rounded w-full mb-2" />
        <div className="h-12 bg-slate-800 rounded w-full" />
      </Card>
    );
  }

  const StatusIcon = statusIcons[data?.status] || Clock;
  const statusColor = statusColors[data?.status] || "text-slate-400";
  const isRunning = data?.status === "running";

  return (
    <Card className="p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusIcon
            className={cn("w-5 h-5", statusColor, isRunning && "animate-spin")}
          />
          <h3 className="font-semibold text-slate-100 text-sm">
            Run Progress
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
          {data?.tokenCount !== undefined && (
            <span title="Tokens used">
              {formatTokens(data.tokenCount)} tokens
            </span>
          )}
          {data?.elapsedMs !== undefined && (
            <span title="Elapsed time">
              {formatDuration(data.elapsedMs)}
            </span>
          )}
        </div>
      </div>

      {data?.progress !== undefined && (
        <Progress
          value={data.progress}
          className="mb-4 h-1.5"
          colorClass={
            data.status === "completed"
              ? "bg-emerald-500"
              : data.status === "failed"
              ? "bg-red-500"
              : "bg-blue-500"
          }
        />
      )}

      {data?.agents && data.agents.length > 0 && (
        <div className="space-y-2">
          {data.agents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-white/5"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {agent.role === "orchestrator"
                    ? "🎯"
                    : agent.role === "researcher"
                    ? "🔍"
                    : agent.role === "builder"
                    ? "🔨"
                    : agent.role === "auditor"
                    ? "🛡️"
                    : "🤖"}
                </span>
                <span className="text-sm text-slate-300">{agent.name}</span>
              </div>
              <Badge
                variant={
                  agent.status === "done"
                    ? "success"
                    : agent.status === "error"
                    ? "danger"
                    : agent.status === "waiting"
                    ? "warning"
                    : "default"
                }
                className="text-[10px]"
              >
                {agent.status.toUpperCase()}
              </Badge>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
        <Badge
          variant={
            data?.status === "completed"
              ? "success"
              : data?.status === "failed"
              ? "danger"
              : "default"
          }
        >
          {(data?.status || "pending").toUpperCase()}
        </Badge>
        {data?.runId && (
          <span className="text-[10px] font-mono text-slate-600">
            {data.runId.slice(0, 8)}
          </span>
        )}
      </div>
    </Card>
  );
}
