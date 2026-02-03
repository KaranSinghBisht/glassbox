"use client";

import { useState } from "react";
import { SwarmEvent } from "@/lib/schemas";
import ActionProposalCard from "./tambo/ActionProposalCard";
import ArtifactViewer from "./tambo/ArtifactViewer";

interface TamboConsoleProps {
  events: SwarmEvent[];
}

type ApprovalState = "pending" | "approved" | "rejected";

export default function TamboConsole({ events }: TamboConsoleProps) {
  const [approvalStates, setApprovalStates] = useState<Record<string, ApprovalState>>({});

  const handleApprove = async (proposalId: string) => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (response.ok) {
        setApprovalStates(prev => ({ ...prev, [proposalId]: "approved" }));
      }
    } catch (error) {
      console.error("Failed to approve:", error);
    }
  };

  const handleReject = async (proposalId: string) => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Rejected by user" }),
      });
      
      if (response.ok) {
        setApprovalStates(prev => ({ ...prev, [proposalId]: "rejected" }));
      }
    } catch (error) {
      console.error("Failed to reject:", error);
    }
  };

  const renderableEvents = events.filter(e => 
    e.type === "ARTIFACT_CREATED" || 
    e.type === "APPROVAL_REQUIRED"
  );

  if (renderableEvents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <div className="text-4xl mb-3">🎯</div>
          <p className="font-medium">No actionable items yet</p>
          <p className="text-sm mt-1">Proposals and artifacts will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 overflow-y-auto">
      {renderableEvents.map((event, index) => {
        const key = `${event.type}-${index}-${event.ts}`;
        
        if (event.type === "APPROVAL_REQUIRED") {
          const payload = event.payload as {
            proposalId: string;
            actionId: string;
            kind: string;
            title: string;
            risk: "low" | "medium" | "high" | "critical";
          };
          
          const state = approvalStates[payload.proposalId];
          if (state === "approved" || state === "rejected") {
            return (
              <div key={key} className={`p-4 rounded-lg border ${
                state === "approved" 
                  ? "bg-green-50 border-green-200 text-green-700" 
                  : "bg-red-50 border-red-200 text-red-700"
              }`}>
                <span className="font-medium">
                  {state === "approved" ? "✅ Approved" : "❌ Rejected"}: {payload.title}
                </span>
              </div>
            );
          }
          
          const kindValue = payload.kind as "write_artifact" | "propose_patch" | "apply_patch" | "export_report" | "execute_code";
          
          return (
            <ActionProposalCard
              key={key}
              data={{
                actionId: payload.actionId,
                kind: kindValue,
                title: payload.title,
                risk: payload.risk,
                rationale: "Awaiting your approval",
                description: "",
                preview: { type: "none" },
                requiresApproval: true,
              }}
              onApprove={() => handleApprove(payload.proposalId)}
              onReject={() => handleReject(payload.proposalId)}
            />
          );
        }
        
        if (event.type === "ARTIFACT_CREATED") {
          const payload = event.payload as {
            artifactId: string;
            name: string;
            contentType?: string;
            contentPreview: string;
          };
          
          return (
            <ArtifactViewer
              key={key}
              data={{
                id: payload.artifactId,
                name: payload.name,
                agentId: event.agentId || "unknown",
                content: payload.contentPreview,
                contentType: payload.contentType,
                createdAt: new Date(event.ts).toISOString(),
              }}
            />
          );
        }
        
        return null;
      })}
    </div>
  );
}
