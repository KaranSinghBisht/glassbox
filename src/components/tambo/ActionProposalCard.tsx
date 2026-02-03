"use client";

import { ActionProposal } from "@/lib/schemas";

const riskStyles = {
  low: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
  medium: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300" },
  high: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300" },
  critical: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" },
};

const kindIcons: Record<string, string> = {
  write_artifact: "📝",
  propose_patch: "🔧",
  apply_patch: "🚀",
  export_report: "📊",
  execute_code: "⚙️",
};

export interface ActionProposalCardProps {
  data: ActionProposal;
  onApprove?: (actionId: string) => void;
  onReject?: (actionId: string) => void;
}

export default function ActionProposalCard({
  data,
  onApprove,
  onReject,
}: ActionProposalCardProps) {
  const risk = riskStyles[data.risk];
  const icon = kindIcons[data.kind] || "❓";

  return (
    <div
      className={`bg-white rounded-lg shadow-md border-2 ${risk.border} overflow-hidden`}
    >
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <h3 className="font-semibold text-slate-800">{data.title}</h3>
          </div>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded ${risk.bg} ${risk.text}`}
          >
            {data.risk.toUpperCase()} RISK
          </span>
        </div>
        <span className="text-xs text-slate-500 uppercase">{data.kind}</span>
      </div>

      <div className="p-4 space-y-3">
        {data.description && (
          <p className="text-sm text-slate-600">{data.description}</p>
        )}

        <div className="bg-slate-50 rounded p-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">
            Rationale
          </h4>
          <p className="text-sm text-slate-700">{data.rationale}</p>
        </div>

        {data.preview.type !== "none" && (
          <div className="bg-slate-50 rounded p-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">
              Preview
            </h4>
            {data.preview.type === "diff" && data.preview.diff && (
              <pre className="text-xs bg-slate-900 text-slate-100 p-2 rounded overflow-x-auto">
                {data.preview.diff}
              </pre>
            )}
            {data.preview.type === "artifact" && data.preview.artifactName && (
              <span className="text-sm text-blue-600">
                📄 {data.preview.artifactName}
              </span>
            )}
          </div>
        )}

        {data.requiresApproval && (
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onApprove?.(data.actionId)}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => onReject?.(data.actionId)}
              className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
