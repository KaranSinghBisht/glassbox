"use client";

import { DiffBeforeAction as DiffBeforeActionType } from "@/lib/schemas";

const riskStyles = {
  low: { bg: "bg-green-50", border: "border-green-200" },
  medium: { bg: "bg-yellow-50", border: "border-yellow-200" },
  high: { bg: "bg-orange-50", border: "border-orange-200" },
  critical: { bg: "bg-red-50", border: "border-red-200" },
};

export interface DiffBeforeActionProps {
  data: DiffBeforeActionType;
  onProceed?: (actionId: string) => void;
  onCancel?: (actionId: string) => void;
}

export default function DiffBeforeAction({
  data,
  onProceed,
  onCancel,
}: DiffBeforeActionProps) {
  const risk = riskStyles[data.risk];

  const lines = data.diff.split("\n");
  const additions = lines.filter((l) => l.startsWith("+") && !l.startsWith("+++")).length;
  const deletions = lines.filter((l) => l.startsWith("-") && !l.startsWith("---")).length;

  return (
    <div className={`rounded-lg border-2 ${risk.border} ${risk.bg} overflow-hidden`}>
      <div className="px-4 py-3 bg-white border-b border-slate-200">
        <h3 className="font-semibold text-slate-800">{data.title}</h3>
        {data.filePath && (
          <span className="text-xs text-slate-500 font-mono">{data.filePath}</span>
        )}
        <div className="mt-2 flex items-center gap-4 text-xs">
          <span className="text-green-600">+{data.linesAdded ?? additions} added</span>
          <span className="text-red-600">−{data.linesRemoved ?? deletions} removed</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <pre className="text-sm p-4 font-mono leading-relaxed">
          {lines.map((line, i) => {
            let className = "text-slate-600";
            let prefix = " ";

            if (line.startsWith("+") && !line.startsWith("+++")) {
              className = "bg-green-100 text-green-800";
              prefix = "+";
            } else if (line.startsWith("-") && !line.startsWith("---")) {
              className = "bg-red-100 text-red-800";
              prefix = "-";
            } else if (line.startsWith("@@")) {
              className = "text-blue-600 bg-blue-50";
            }

            return (
              <div key={i} className={`${className} px-2 -mx-2`}>
                <span className="select-none text-slate-400 mr-2">{prefix}</span>
                {line.startsWith("+") || line.startsWith("-") ? line.slice(1) : line}
              </div>
            );
          })}
        </pre>
      </div>

      <div className="px-4 py-3 bg-white border-t border-slate-200 flex gap-2">
        <button
          onClick={() => onProceed?.(data.actionId)}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Apply Changes
        </button>
        <button
          onClick={() => onCancel?.(data.actionId)}
          className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
