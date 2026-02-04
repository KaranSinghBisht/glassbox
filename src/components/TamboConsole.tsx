"use client";

import { useState, useEffect, useRef } from "react";
import { useTamboThreadInput } from "@tambo-ai/react";
import { SwarmEvent } from "@/lib/schemas";
import ActionProposalCard from "./tambo/ActionProposalCard";
import ArtifactViewer from "./tambo/ArtifactViewer";

interface TamboConsoleProps {
  events: SwarmEvent[];
}

type ApprovalState = "pending" | "approved" | "rejected";

function formatEventForTambo(event: SwarmEvent): string | null {
  switch (event.type) {
    case "ARTIFACT_CREATED": {
      const payload = event.payload as { name: string; contentPreview?: string };
      return `An artifact was created: "${payload.name}". Display it using ArtifactViewer component.`;
    }
    case "APPROVAL_REQUIRED": {
      const payload = event.payload as { title: string; risk: string };
      return `Action needs approval: "${payload.title}" (risk level: ${payload.risk}). Show ActionProposalCard component.`;
    }
    case "RUN_CREATED": {
      const payload = event.payload as { prompt: string };
      return `New agent run started for: "${payload.prompt}". Show TaskPlanCard with the execution plan.`;
    }
    case "RUN_COMPLETED": {
      const payload = event.payload as { status: string; summary?: string };
      return `Run completed with status: ${payload.status}. ${payload.summary || ""} Show AuditSummary component.`;
    }
    default:
      return null;
  }
}

export default function TamboConsole({ events }: TamboConsoleProps) {
  const [approvalStates, setApprovalStates] = useState<Record<string, ApprovalState>>({});
  const processedEventsRef = useRef<Set<string>>(new Set());
  
  const { setValue, submit } = useTamboThreadInput();

  useEffect(() => {
    const sendEventMessages = async () => {
      for (const event of events) {
        const eventKey = `${event.type}-${event.ts}-${event.agentId || ""}`;
        
        if (processedEventsRef.current.has(eventKey)) continue;
        
        const message = formatEventForTambo(event);
        if (message) {
          processedEventsRef.current.add(eventKey);
          setValue(message);
          try {
            await submit();
          } catch (error) {
            console.error("Failed to send to Tambo:", error);
          }
        }
      }
    };
    
    sendEventMessages();
  }, [events, setValue, submit]);

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
                  ? "bg-green-900/30 border-green-800 text-green-300" 
                  : "bg-red-900/30 border-red-800 text-red-300"
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
