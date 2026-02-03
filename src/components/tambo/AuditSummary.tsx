"use client";

import { AuditSummary as AuditSummaryType } from "@/lib/schemas";

const confidenceStyles = {
  low: { bg: "bg-red-100", text: "text-red-700", icon: "⚠️" },
  medium: { bg: "bg-yellow-100", text: "text-yellow-700", icon: "⚡" },
  high: { bg: "bg-green-100", text: "text-green-700", icon: "✓" },
};

export interface AuditSummaryProps {
  data: AuditSummaryType;
}

export default function AuditSummary({ data }: AuditSummaryProps) {
  const confidence = confidenceStyles[data.overallConfidence];

  return (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
      <div className={`px-4 py-3 ${confidence.bg} border-b border-slate-200`}>
        <div className="flex items-center gap-2">
          <span className="text-xl">{confidence.icon}</span>
          <div>
            <h3 className="font-semibold text-slate-800">Audit Summary</h3>
            <span className={`text-sm font-medium ${confidence.text}`}>
              {data.overallConfidence.toUpperCase()} CONFIDENCE
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {data.redFlags.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-red-600 uppercase mb-2 flex items-center gap-1">
              🚩 Red Flags ({data.redFlags.length})
            </h4>
            <ul className="space-y-1">
              {data.redFlags.map((flag, i) => (
                <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.verifyChecklist.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-600 uppercase mb-2 flex items-center gap-1">
              ☑️ Verify Before Proceeding
            </h4>
            <ul className="space-y-1">
              {data.verifyChecklist.map((item, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                  <input type="checkbox" className="mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.assumptions && data.assumptions.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">
              Assumptions Made
            </h4>
            <ul className="space-y-1">
              {data.assumptions.map((assumption, i) => (
                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="text-slate-400">→</span>
                  {assumption}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.recommendations && data.recommendations.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-blue-600 uppercase mb-2">
              💡 Recommendations
            </h4>
            <ul className="space-y-1">
              {data.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
