'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';

export type AgentStatus = 'idle' | 'thinking' | 'waiting' | 'acting' | 'done' | 'error';

export type AgentNodeData = {
  label: string;
  role: string;
  status: AgentStatus;
};

const statusConfig: Record<AgentStatus, { color: string; bgColor: string; pulse: boolean }> = {
  idle: { color: '#94a3b8', bgColor: '#f1f5f9', pulse: false },
  thinking: { color: '#3b82f6', bgColor: '#eff6ff', pulse: true },
  waiting: { color: '#f59e0b', bgColor: '#fffbeb', pulse: true },
  acting: { color: '#8b5cf6', bgColor: '#f5f3ff', pulse: true },
  done: { color: '#10b981', bgColor: '#ecfdf5', pulse: false },
  error: { color: '#ef4444', bgColor: '#fef2f2', pulse: false },
};

const roleIcons: Record<string, string> = {
  orchestrator: '🎯',
  researcher: '🔍',
  builder: '🔨',
  auditor: '🛡️',
};

function AgentNode({ data }: NodeProps<Node<AgentNodeData>>) {
  const config = statusConfig[data.status];
  const icon = roleIcons[data.role] || '🤖';

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-white shadow-md min-w-[160px] transition-all duration-300 ${
        config.pulse ? 'animate-pulse' : ''
      }`}
      style={{ 
        borderColor: config.color,
        backgroundColor: config.bgColor,
      }}
      data-testid="agent-node"
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-slate-800">{data.label}</span>
          <span className="text-[10px] uppercase text-slate-500 tracking-wider">
            {data.role}
          </span>
        </div>
      </div>
      
      <div className="mt-2 flex items-center gap-1.5">
        <div 
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: config.color }}
        />
        <span className="text-[10px] uppercase font-medium" style={{ color: config.color }}>
          {data.status}
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
    </div>
  );
}

export default memo(AgentNode);
