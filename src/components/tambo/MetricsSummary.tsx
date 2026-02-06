"use client";

import { MetricsSummary as MetricsSummaryType } from "@/lib/schemas";
import { useTamboStreamStatus } from "@tambo-ai/react";
import { Card, Progress } from "@/components/ui/primitives";
import { Cpu, DollarSign, Zap, Clock, BarChart3 } from "lucide-react";

export interface MetricsSummaryProps {
  data: MetricsSummaryType;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function formatCost(cost: number): string {
  if (cost < 0.01) return "<$0.01";
  return `$${cost.toFixed(3)}`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default function MetricsSummary({ data }: MetricsSummaryProps) {
  const { streamStatus } = useTamboStreamStatus<MetricsSummaryType>();

  if (streamStatus.isPending) {
    return (
      <Card className="p-4 animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-800 rounded" />
          ))}
        </div>
      </Card>
    );
  }

  const maxAgentTokens = data?.agentBreakdown
    ? Math.max(...data.agentBreakdown.map((a) => a.tokens), 1)
    : 1;

  return (
    <Card className="p-0 overflow-hidden animate-fade-in border-emerald-500/20">
      <div className="bg-gradient-to-r from-emerald-500/10 to-transparent p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-slate-100">Run Metrics</h3>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-slate-900/50 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] text-slate-500 uppercase font-medium">
                Tokens
              </span>
            </div>
            <p className="text-lg font-bold font-mono text-slate-100">
              {formatTokens(data?.totalTokens || 0)}
            </p>
            <div className="flex gap-2 mt-1 text-[10px] text-slate-500">
              <span>In: {formatTokens(data?.inputTokens || 0)}</span>
              <span>Out: {formatTokens(data?.outputTokens || 0)}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/50 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] text-slate-500 uppercase font-medium">
                LLM Calls
              </span>
            </div>
            <p className="text-lg font-bold font-mono text-slate-100">
              {data?.llmCalls || 0}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/50 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] text-slate-500 uppercase font-medium">
                Est. Cost
              </span>
            </div>
            <p className="text-lg font-bold font-mono text-slate-100">
              {formatCost(data?.estimatedCost || 0)}
            </p>
          </div>

          {data?.totalElapsedMs !== undefined && (
            <div className="p-3 rounded-lg bg-slate-900/50 border border-white/5">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-[10px] text-slate-500 uppercase font-medium">
                  Duration
                </span>
              </div>
              <p className="text-lg font-bold font-mono text-slate-100">
                {formatDuration(data.totalElapsedMs)}
              </p>
            </div>
          )}
        </div>

        {data?.agentBreakdown && data.agentBreakdown.length > 0 && (
          <div>
            <h4 className="text-[10px] text-slate-500 uppercase font-medium mb-2">
              Agent Breakdown
            </h4>
            <div className="space-y-2">
              {data.agentBreakdown.map((agent, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-slate-900/30 border border-white/5"
                >
                  <div className="flex items-center justify-between mb-1.5">
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
                      <span className="text-xs font-medium text-slate-300">
                        {agent.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                      <span>{formatTokens(agent.tokens)} tok</span>
                      <span>{formatDuration(agent.elapsedMs)}</span>
                    </div>
                  </div>
                  <Progress
                    value={(agent.tokens / maxAgentTokens) * 100}
                    className="h-1"
                    colorClass={
                      agent.role === "orchestrator"
                        ? "bg-blue-500"
                        : agent.role === "researcher"
                        ? "bg-cyan-500"
                        : agent.role === "builder"
                        ? "bg-violet-500"
                        : "bg-emerald-500"
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
