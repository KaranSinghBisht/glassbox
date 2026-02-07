"use client";

import { AgentInspector as AgentInspectorType } from "@/lib/schemas";
import { useTamboStreamStatus } from "@tambo-ai/react";
import { Card, Badge } from "@/components/ui/primitives";
import { User, Cpu, Clock, MessageSquare } from "lucide-react";

export interface AgentInspectorProps {
  data: AgentInspectorType;
}

const roleIcons: Record<string, string> = {
  orchestrator: "🎯",
  researcher: "🔍",
  builder: "🔨",
  auditor: "🛡️",
};

const statusVariants: Record<string, "success" | "warning" | "danger" | "default"> = {
  done: "success",
  error: "danger",
  waiting: "warning",
  thinking: "default",
  acting: "default",
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default function AgentInspector({ data }: AgentInspectorProps) {
  const { streamStatus } = useTamboStreamStatus<AgentInspectorType>();

  if (streamStatus.isPending) {
    return (
      <Card className="p-4 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/2 mb-3" />
        <div className="h-4 bg-slate-800 rounded w-full mb-2" />
        <div className="h-4 bg-slate-800 rounded w-3/4" />
      </Card>
    );
  }

  const normalizedRole = data?.role?.toLowerCase() || "";
  const normalizedStatus = data?.status?.toLowerCase() || "";
  const icon = roleIcons[normalizedRole] || "🤖";

  return (
    <Card className="p-0 overflow-hidden animate-fade-in border-blue-500/20">
      <div className="bg-gradient-to-r from-blue-500/10 to-transparent p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-slate-700 flex items-center justify-center text-2xl">
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-100">{data?.name}</h3>
              <Badge
                variant={statusVariants[normalizedStatus] || "default"}
                className="text-[10px]"
              >
                {(normalizedStatus || "unknown").toUpperCase()}
              </Badge>
            </div>
            <span className="text-xs text-slate-500 uppercase tracking-wider">
              {data?.role}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {data?.tokenCount !== undefined && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50 border border-white/5">
              <Cpu className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Tokens</p>
                <p className="text-sm font-mono text-slate-300">
                  {data.tokenCount.toLocaleString()}
                </p>
              </div>
            </div>
          )}
          {data?.elapsedMs !== undefined && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50 border border-white/5">
              <Clock className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Duration</p>
                <p className="text-sm font-mono text-slate-300">
                  {formatDuration(data.elapsedMs)}
                </p>
              </div>
            </div>
          )}
        </div>

        {data?.lastMessage && (
          <div className="p-3 rounded-lg bg-slate-900/50 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1">
              <MessageSquare className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] text-slate-500 uppercase font-medium">
                Last Message
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {data.lastMessage}
            </p>
          </div>
        )}

        {data?.outputs && data.outputs.length > 0 && (
          <div>
            <h4 className="text-[10px] text-slate-500 uppercase font-medium mb-2 flex items-center gap-1">
              <User className="w-3 h-3" /> Outputs ({data.outputs.length})
            </h4>
            <div className="space-y-1">
              {data.outputs.map((output, i) => (
                <div
                  key={i}
                  className="text-xs text-slate-400 p-2 rounded bg-slate-900/30 border border-white/5 truncate"
                >
                  {output}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-2 bg-slate-900/30 border-t border-white/5 text-[10px] text-slate-600 font-mono">
        ID: {data?.agentId?.slice(0, 12)}
      </div>
    </Card>
  );
}
