"use client";

import { useState } from "react";
import { Badge, Progress } from "@/components/ui/primitives";
import { cn } from "@/components/ui/primitives";
import { Users, ChevronDown, ChevronRight } from "lucide-react";

interface AgentInfo {
  id: string;
  name: string;
  role: string;
  status: string;
  progress?: number;
  lastMessage?: string;
}

interface AgentStatusPanelProps {
  agents: AgentInfo[];
  onAgentClick?: (agentId: string) => void;
}

const roleIcons: Record<string, string> = {
  orchestrator: "🎯",
  researcher: "🔍",
  builder: "🔨",
  auditor: "🛡️",
};

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  idle: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20" },
  thinking: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  waiting: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  acting: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  done: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  error: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  blocked: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  escalated: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20" },
};

function AgentCard({ agent, onClick }: { agent: AgentInfo; onClick?: () => void }) {
  const colors = statusColors[agent.status] || statusColors.idle;
  const icon = roleIcons[agent.role] || "🤖";
  const isActive = ["thinking", "acting", "waiting"].includes(agent.status);

  return (
    <div
      className={cn(
        "p-3 rounded-xl transition-all border glass-card",
        colors.border,
        onClick && "cursor-pointer hover:scale-[1.02] hover:border-slate-600"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center text-xl",
          colors.bg
        )}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-200 truncate">
              {agent.name}
            </span>
            <Badge
              variant={agent.status === "done" ? "success" : agent.status === "error" ? "danger" : "default"}
              className="text-[10px] shrink-0"
            >
              {agent.status.toUpperCase()}
            </Badge>
          </div>
          <span className="text-[10px] uppercase text-slate-500 tracking-wider">
            {agent.role}
          </span>
          {agent.lastMessage && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-1">
              {agent.lastMessage}
            </p>
          )}
          {isActive && agent.progress !== undefined && (
            <Progress value={agent.progress} className="mt-2" colorClass={colors.text.replace("text-", "bg-")} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function AgentStatusPanel({ agents, onAgentClick }: AgentStatusPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (agents.length === 0) {
    return (
      <div className="p-4 text-center">
        <Users className="w-8 h-8 mx-auto mb-2 text-slate-700" />
        <p className="text-xs text-slate-600">No agents spawned yet</p>
      </div>
    );
  }

  const activeCount = agents.filter(a => ["thinking", "acting", "waiting"].includes(a.status)).length;
  const doneCount = agents.filter(a => a.status === "done").length;

  return (
    <div className="flex flex-col h-full">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between px-4 py-2 bg-slate-900/50 border-t border-b border-white/5 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
          <span className="text-sm font-medium text-slate-300">Agent Status</span>
          <Badge variant="outline" className="text-[10px]">
            {agents.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          {activeCount > 0 && (
            <span className="text-blue-400">{activeCount} active</span>
          )}
          {doneCount > 0 && (
            <span className="text-emerald-400">{doneCount} done</span>
          )}
        </div>
      </button>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 auto-rows-min">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onClick={onAgentClick ? () => onAgentClick(agent.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
