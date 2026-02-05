"use client";

import { Cpu, DollarSign, Zap } from "lucide-react";

interface LLMMetricsProps {
  inputTokens: number;
  outputTokens: number;
  calls: number;
  estimatedCost: number;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

function formatCost(cost: number): string {
  if (cost < 0.01) {
    return "<$0.01";
  }
  return `$${cost.toFixed(2)}`;
}

export default function LLMMetrics({
  inputTokens,
  outputTokens,
  calls,
  estimatedCost,
}: LLMMetricsProps) {
  const totalTokens = inputTokens + outputTokens;

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-800/50">
      <div className="flex items-center gap-1.5" title={`${calls} LLM calls`}>
        <Zap className="w-3 h-3 text-amber-400" />
        <span className="text-xs font-mono text-slate-400">{calls}</span>
      </div>
      
      <div className="w-px h-3 bg-slate-700" />
      
      <div className="flex items-center gap-1.5" title={`${inputTokens} in / ${outputTokens} out`}>
        <Cpu className="w-3 h-3 text-blue-400" />
        <span className="text-xs font-mono text-slate-400">
          {formatNumber(totalTokens)}
        </span>
      </div>
      
      <div className="w-px h-3 bg-slate-700" />
      
      <div className="flex items-center gap-1.5" title="Estimated cost">
        <DollarSign className="w-3 h-3 text-emerald-400" />
        <span className="text-xs font-mono text-slate-400">
          {formatCost(estimatedCost)}
        </span>
      </div>
    </div>
  );
}
