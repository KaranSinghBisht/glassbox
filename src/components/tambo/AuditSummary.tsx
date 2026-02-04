"use client";

import { AuditSummary as AuditSummaryType } from "@/lib/schemas";
import { Card, Button, cn } from "@/components/ui/primitives";
import { ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

const confidenceStyles = {
  low: { bg: "from-slate-900 to-red-950/20", border: "border-red-500/20", color: "text-red-400" },
  medium: { bg: "from-slate-900 to-amber-950/20", border: "border-amber-500/20", color: "text-amber-400" },
  high: { bg: "from-slate-900 to-emerald-950/20", border: "border-emerald-500/20", color: "text-emerald-400" },
};

const confidencePercent = {
  low: 45,
  medium: 72,
  high: 95,
};

export interface AuditSummaryProps {
  data: AuditSummaryType;
}

export default function AuditSummary({ data }: AuditSummaryProps) {
  const confidence = confidenceStyles[data.overallConfidence];
  const percent = confidencePercent[data.overallConfidence];

  return (
    <Card
      className={cn(
        "p-5 animate-fade-in bg-gradient-to-br",
        confidence.bg,
        confidence.border
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("p-2 rounded-lg bg-emerald-500/10", confidence.color)}>
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-100">
            {data.overallConfidence === "high"
              ? "Security Audit Passed"
              : data.overallConfidence === "medium"
              ? "Audit Complete - Review Needed"
              : "Audit Complete - Issues Found"}
          </h3>
          <p className="text-xs text-slate-400">Automated verification complete</p>
        </div>
        <div className="ml-auto text-right">
          <span className={cn("text-2xl font-bold", confidence.color)}>
            {percent}%
          </span>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">
            Confidence
          </div>
        </div>
      </div>

      {data.redFlags.length > 0 && (
        <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20">
          <h4 className="text-xs font-semibold text-red-400 uppercase mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Red Flags ({data.redFlags.length})
          </h4>
          <ul className="space-y-1">
            {data.redFlags.map((flag, i) => (
              <li key={i} className="text-sm text-red-300 flex items-start gap-2">
                <span className="text-red-500">•</span>
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.verifyChecklist.length > 0 && (
        <div className="space-y-2 mb-4">
          {data.verifyChecklist.map((check, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-sm p-2 rounded bg-slate-950/50 border border-white/5"
            >
              <span className="text-slate-300">{check}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
          ))}
        </div>
      )}

      {data.assumptions && data.assumptions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">
            Assumptions
          </h4>
          <ul className="space-y-1">
            {data.assumptions.map((assumption, i) => (
              <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                <span className="text-slate-600">→</span>
                {assumption}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.recommendations && data.recommendations.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-blue-400 uppercase mb-2">
            Recommendations
          </h4>
          <ul className="space-y-1">
            {data.recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-blue-500">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button variant="outline" size="sm" className="w-full text-xs border-dashed">
        View Full Report <ArrowRight className="w-3 h-3 ml-2" />
      </Button>
    </Card>
  );
}
