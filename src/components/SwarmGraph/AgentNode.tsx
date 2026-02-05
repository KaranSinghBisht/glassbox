"use client";

import { memo } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";

export type AgentStatus =
  | "idle"
  | "thinking"
  | "waiting"
  | "acting"
  | "done"
  | "error"
  | "blocked"
  | "escalated";

export type AgentNodeData = {
  label: string;
  role: string;
  status: AgentStatus;
  progress?: number;
};

const statusConfig: Record<
  AgentStatus,
  { color: string; bgColor: string; borderColor: string; pulse: boolean; glow: boolean }
> = {
  idle: {
    color: "#64748b",
    bgColor: "rgba(30, 41, 59, 0.8)",
    borderColor: "#334155",
    pulse: false,
    glow: false,
  },
  thinking: {
    color: "#3b82f6",
    bgColor: "rgba(30, 58, 138, 0.3)",
    borderColor: "#3b82f6",
    pulse: true,
    glow: true,
  },
  waiting: {
    color: "#f59e0b",
    bgColor: "rgba(120, 53, 15, 0.3)",
    borderColor: "#f59e0b",
    pulse: true,
    glow: false,
  },
  acting: {
    color: "#8b5cf6",
    bgColor: "rgba(76, 29, 149, 0.3)",
    borderColor: "#8b5cf6",
    pulse: true,
    glow: true,
  },
  done: {
    color: "#10b981",
    bgColor: "rgba(6, 78, 59, 0.3)",
    borderColor: "#10b981",
    pulse: false,
    glow: false,
  },
  error: {
    color: "#ef4444",
    bgColor: "rgba(127, 29, 29, 0.3)",
    borderColor: "#ef4444",
    pulse: false,
    glow: false,
  },
  blocked: {
    color: "#f97316",
    bgColor: "rgba(154, 52, 18, 0.3)",
    borderColor: "#f97316",
    pulse: true,
    glow: false,
  },
  escalated: {
    color: "#ec4899",
    bgColor: "rgba(131, 24, 67, 0.3)",
    borderColor: "#ec4899",
    pulse: true,
    glow: true,
  },
};

const roleIcons: Record<string, string> = {
  orchestrator: "🎯",
  researcher: "🔍",
  builder: "🔨",
  auditor: "🛡️",
};

function AgentNode({ data }: NodeProps<Node<AgentNodeData>>) {
  const config = statusConfig[data.status];
  const icon = roleIcons[data.role] || "🤖";
  const showProgress = data.progress !== undefined && data.progress > 0 && data.progress < 100;

  const glowShadow = config.glow
    ? `0 0 30px ${config.color}50, 0 0 60px ${config.color}20`
    : config.pulse
    ? `0 0 20px ${config.color}30`
    : "0 4px 6px -1px rgba(0, 0, 0, 0.3)";

  return (
    <div
      className={`px-4 py-3 rounded-xl border-2 shadow-lg min-w-[160px] transition-all duration-300 backdrop-blur-sm ${
        config.pulse ? "animate-pulse-ring" : ""
      } ${config.glow ? "animate-glow" : ""}`}
      style={{
        borderColor: config.borderColor,
        backgroundColor: config.bgColor,
        boxShadow: glowShadow,
      }}
      data-testid="agent-node"
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-slate-600 !border-slate-500"
      />

      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-slate-100">
            {data.label}
          </span>
          <span className="text-[10px] uppercase text-slate-400 tracking-wider">
            {data.role}
          </span>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <div
          className={`w-2 h-2 rounded-full ${config.pulse ? "animate-status-pulse" : ""}`}
          style={{
            backgroundColor: config.color,
            boxShadow: config.pulse ? `0 0 8px ${config.color}` : "none",
          }}
        />
        <span
          className="text-[10px] uppercase font-medium"
          style={{ color: config.color }}
        >
          {data.status}
        </span>
      </div>

      {showProgress && (
        <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-500 ease-out rounded-full"
            style={{
              width: `${data.progress}%`,
              backgroundColor: config.color,
            }}
          />
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-slate-600 !border-slate-500"
      />
    </div>
  );
}

export default memo(AgentNode);
