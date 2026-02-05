"use client";

import { useState } from "react";
import { ActionProposal } from "@/lib/schemas";
import { Card, Badge, Button, cn } from "@/components/ui/primitives";
import { AlertTriangle, Check, X } from "lucide-react";

const riskStyles = {
  low: { badge: "success" as const, border: "border-emerald-500/30" },
  medium: { badge: "warning" as const, border: "border-amber-500/30" },
  high: { badge: "danger" as const, border: "border-orange-500/30" },
  critical: { badge: "danger" as const, border: "border-red-500/30" },
};

export interface ActionProposalCardProps {
  data: ActionProposal;
  onApprove?: (actionId: string) => Promise<void> | void;
  onReject?: (actionId: string) => Promise<void> | void;
}

export default function ActionProposalCard({
  data,
  onApprove,
  onReject,
}: ActionProposalCardProps) {
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "loading">("pending");
  const [error, setError] = useState<string | null>(null);
  const risk = riskStyles[data.risk];

  const canApprove = Boolean(onApprove || data.proposalId);
  const canReject = Boolean(onReject || data.proposalId);

  const handleApprove = async () => {
    setError(null);
    if (!canApprove) {
      setError("Missing proposalId; cannot submit approval.");
      return;
    }

    setStatus("loading");
    try {
      if (onApprove) {
        await onApprove(data.actionId);
      } else if (data.proposalId) {
        const res = await fetch(`/api/proposals/${data.proposalId}/approve`, { method: "POST" });
        if (!res.ok) throw new Error("Failed to approve");
      }
      setStatus("approved");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to approve";
      setError(message);
      setStatus("pending");
    }
  };

  const handleReject = async () => {
    setError(null);
    if (!canReject) {
      setError("Missing proposalId; cannot submit rejection.");
      return;
    }

    setStatus("loading");
    try {
      if (onReject) {
        await onReject(data.actionId);
      } else if (data.proposalId) {
        const res = await fetch(`/api/proposals/${data.proposalId}/reject`, { method: "POST" });
        if (!res.ok) throw new Error("Failed to reject");
      }
      setStatus("rejected");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to reject";
      setError(message);
      setStatus("pending");
    }
  };

  if (status === "loading") {
    return (
      <Card className="p-6 flex flex-col items-center justify-center text-center animate-fade-in border-slate-800">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-blue-500/10 text-blue-500">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
        <h3 className="text-slate-200 font-medium">Processing...</h3>
      </Card>
    );
  }

  if (status === "approved" || status === "rejected") {
    return (
      <Card className="p-6 flex flex-col items-center justify-center text-center animate-fade-in border-slate-800">
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center mb-3",
            status === "approved"
              ? "bg-emerald-500/10 text-emerald-500"
              : "bg-red-500/10 text-red-500"
          )}
        >
          {status === "approved" ? (
            <Check className="w-6 h-6" />
          ) : (
            <X className="w-6 h-6" />
          )}
        </div>
        <h3 className="text-slate-200 font-medium">Decision Recorded</h3>
        <p className="text-sm text-slate-500 mt-1">
          Proposal was {status} by human operator.
        </p>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "p-0 overflow-hidden animate-fade-in shadow-[0_0_30px_-10px_rgba(245,158,11,0.15)]",
        risk.border
      )}
    >
      <div className="bg-gradient-to-r from-amber-500/10 to-transparent p-4 border-b border-amber-500/10">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
              <span className="text-amber-500 font-bold text-xs tracking-wider uppercase">
                Approval Required
              </span>
            </div>
            <h3 className="text-lg font-semibold text-slate-100">{data.title}</h3>
          </div>
          <Badge variant={risk.badge} className="animate-pulse">
            {data.risk.toUpperCase()} Risk
          </Badge>
        </div>
        {data.description && (
          <p className="text-sm text-slate-400 mt-2">{data.description}</p>
        )}
      </div>

      <div className="p-4 bg-slate-950/50 space-y-3">
        <div className="bg-slate-900/50 rounded p-3 border border-white/5">
          <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">
            Rationale
          </h4>
          <p className="text-sm text-slate-300">{data.rationale}</p>
        </div>

        {data.preview.type === "diff" && data.preview.diff && (
          <div className="text-xs font-mono bg-black/40 p-3 rounded border border-white/5 text-slate-400 overflow-x-auto">
            {data.preview.diff.split("\n").map((line, i) => (
              <div
                key={i}
                className={
                  line.startsWith("+")
                    ? "text-emerald-400"
                    : line.startsWith("-")
                    ? "text-red-400"
                    : ""
                }
              >
                {line}
              </div>
            ))}
          </div>
        )}
      </div>

      {data.requiresApproval && (
        <div className="p-4 flex gap-3 justify-end bg-slate-900/50 border-t border-white/5">
          <Button
            variant="ghost"
            onClick={handleReject}
            disabled={!canReject}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            Reject
          </Button>
          <Button
            onClick={handleApprove}
            disabled={!canApprove}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-amber-900/20"
          >
            Approve Action
          </Button>
        </div>
      )}

      {error && (
        <div className="px-4 pb-4 text-xs text-red-400">
          {error}
        </div>
      )}
    </Card>
  );
}
