"use client";

import { useState, useEffect, useRef } from "react";
import { SwarmEvent, TEventType } from "@/lib/schemas";
import { getComponentForEvent, hasComponentForEvent } from "@/lib/componentRegistry";
import ActionProposalCard from "./tambo/ActionProposalCard";
import ArtifactViewer from "./tambo/ArtifactViewer";
import AgentMessageCard from "./tambo/AgentMessageCard";
import ErrorCard from "./tambo/ErrorCard";

interface TamboConsoleProps {
  events: SwarmEvent[];
}

type ApprovalState = "pending" | "approved" | "rejected";

export default function TamboConsole({ events }: TamboConsoleProps) {
  const [approvalStates, setApprovalStates] = useState<Record<string, ApprovalState>>({});
  const prevEventsLengthRef = useRef<number>(0);
  
  useEffect(() => {
    if (events.length === 0 && prevEventsLengthRef.current > 0) {
      // Reset approval states when events are cleared (new run started)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setApprovalStates({});
    }
    prevEventsLengthRef.current = events.length;
  }, [events.length]);

  const handleApprove = async (proposalId: string) => {
    const response = await fetch(`/api/proposals/${proposalId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!response.ok) {
      throw new Error("Failed to approve");
    }
    setApprovalStates(prev => ({ ...prev, [proposalId]: "approved" }));
  };

  const handleReject = async (proposalId: string) => {
    const response = await fetch(`/api/proposals/${proposalId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Rejected by user" }),
    });
    
    if (!response.ok) {
      throw new Error("Failed to reject");
    }
    setApprovalStates(prev => ({ ...prev, [proposalId]: "rejected" }));
  };

  // Filter for events that have registered components
  const renderableEvents = events.filter(e => 
    hasComponentForEvent(e.type as TEventType)
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
        const eventType = event.type as TEventType;
        
        // Special handling for APPROVAL_REQUIRED (needs callbacks)
        if (eventType === "APPROVAL_REQUIRED") {
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
                proposalId: payload.proposalId,
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
        
        // Special handling for ARTIFACT_CREATED (needs data mapping)
        if (eventType === "ARTIFACT_CREATED") {
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
                content: payload.contentPreview || "",
                contentType: payload.contentType,
                createdAt: new Date(event.ts).toISOString(),
              }}
            />
          );
        }
        
        // Handle AGENT_MESSAGE using registry
        if (eventType === "AGENT_MESSAGE") {
          const payload = event.payload as {
            summary: string;
            to?: string;
            dataRef?: string;
          };
          
          return (
            <AgentMessageCard
              key={key}
              data={payload}
            />
          );
        }
        
        // Handle ERROR using registry
        if (eventType === "ERROR") {
          const payload = event.payload as {
            code?: string;
            message: string;
            stack?: string;
          };
          
          return (
            <ErrorCard
              key={key}
              data={payload}
            />
          );
        }
        
        // Fallback: Try using registry for other event types
        const Component = getComponentForEvent(eventType);
        if (Component) {
          return <Component key={key} data={event.payload} event={event} />;
        }
        
        return null;
      })}
    </div>
  );
}
