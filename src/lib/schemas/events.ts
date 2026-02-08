import { z } from "zod";

export const EventType = z
  .enum([
    "RUN_CREATED",
    "AGENT_SPAWNED",
    "AGENT_STATUS",
    "AGENT_MESSAGE",
    "AGENT_PROGRESS",
    "AGENT_BLOCKED",
    "AGENT_ESCALATED",
    "TOOL_PROPOSED",
    "APPROVAL_REQUIRED",
    "APPROVAL_GRANTED",
    "APPROVAL_REJECTED",
    "TOOL_EXECUTED",
    "ARTIFACT_CREATED",
    "ERROR",
    "RUN_COMPLETED",
  ])
  .describe("Type of event in the swarm lifecycle");

export const EventAgentRole = z
  .enum(["orchestrator", "researcher", "builder", "auditor"])
  .describe("Role of the agent that generated this event");

export const EventAgentStatus = z
  .enum(["idle", "thinking", "waiting", "acting", "done", "error", "blocked", "escalated", "rejected"])
  .describe("Status of the agent at event time");

export const BaseEventSchema = z.object({
  id: z.string().optional().describe("Unique event ID for deduplication"),
  type: EventType,
  runId: z.string().describe("ID of the run this event belongs to"),
  ts: z.number().describe("Unix timestamp in milliseconds"),
  agentId: z.string().optional().describe("ID of the agent that emitted this event"),
});

export const AgentSpawnedPayload = z.object({
  name: z.string().describe("Name of the spawned agent"),
  role: EventAgentRole,
  parentId: z.string().optional().describe("ID of the parent agent"),
});

export const AgentStatusPayload = z.object({
  status: EventAgentStatus,
  message: z.string().optional().describe("Optional status message"),
});

export const AgentMessagePayload = z.object({
  to: z.string().optional().describe("Target agent ID if directed"),
  summary: z.string().describe("Human-readable message summary"),
  dataRef: z.string().optional().describe("Reference to associated data"),
});

export const AgentProgressPayload = z.object({
  progress: z.string().describe("Human-readable progress message"),
  percentage: z.number().min(0).max(100).optional().describe("Completion percentage (0-100)"),
  step: z.string().optional().describe("Current step identifier"),
});

export const AgentBlockedPayload = z.object({
  reason: z.string().describe("Reason why the agent is blocked"),
  blockedBy: z.string().optional().describe("What is blocking the agent"),
});

export const AgentEscalatedPayload = z.object({
  reason: z.string().describe("Reason for escalation"),
  severity: z.enum(["warning", "critical"]).default("warning").describe("Severity of escalation"),
});

export const ArtifactCreatedPayload = z.object({
  artifactId: z.string().describe("ID of the created artifact"),
  name: z.string().describe("Name of the artifact"),
  contentType: z.string().optional().describe("MIME type of the artifact"),
  contentPreview: z.string().optional().describe("Short preview of content"),
});

export const ApprovalRequiredPayload = z.object({
  proposalId: z.string().describe("ID of the action proposal"),
  actionId: z.string().describe("ID of the proposed action"),
  kind: z.string().describe("Type of action requiring approval"),
  title: z.string().describe("Title of the proposed action"),
  risk: z.enum(["low", "medium", "high", "critical"]).describe("Risk level"),
});

export const ErrorPayload = z.object({
  code: z.string().optional().describe("Error code if available"),
  message: z.string().describe("Error message"),
});

export const EventSchema = z.discriminatedUnion("type", [
  BaseEventSchema.extend({
    type: z.literal("RUN_CREATED"),
    payload: z.object({
      prompt: z.string().describe("The user prompt that started this run"),
    }),
  }),
  BaseEventSchema.extend({
    type: z.literal("AGENT_SPAWNED"),
    payload: AgentSpawnedPayload,
  }),
  BaseEventSchema.extend({
    type: z.literal("AGENT_STATUS"),
    payload: AgentStatusPayload,
  }),
  BaseEventSchema.extend({
    type: z.literal("AGENT_MESSAGE"),
    payload: AgentMessagePayload,
  }),
  BaseEventSchema.extend({
    type: z.literal("AGENT_PROGRESS"),
    payload: AgentProgressPayload,
  }),
  BaseEventSchema.extend({
    type: z.literal("AGENT_BLOCKED"),
    payload: AgentBlockedPayload,
  }),
  BaseEventSchema.extend({
    type: z.literal("AGENT_ESCALATED"),
    payload: AgentEscalatedPayload,
  }),
  BaseEventSchema.extend({
    type: z.literal("ARTIFACT_CREATED"),
    payload: ArtifactCreatedPayload,
  }),
  BaseEventSchema.extend({
    type: z.literal("APPROVAL_REQUIRED"),
    payload: ApprovalRequiredPayload,
  }),
  BaseEventSchema.extend({
    type: z.literal("APPROVAL_GRANTED"),
    payload: z.object({
      proposalId: z.string().describe("ID of the approved proposal"),
    }),
  }),
  BaseEventSchema.extend({
    type: z.literal("APPROVAL_REJECTED"),
    payload: z.object({
      proposalId: z.string().describe("ID of the rejected proposal"),
      reason: z.string().optional().describe("Reason for rejection"),
    }),
  }),
  BaseEventSchema.extend({
    type: z.literal("TOOL_PROPOSED"),
    payload: z.object({
      toolName: z.string().describe("Name of the tool to be used"),
      args: z.record(z.string(), z.unknown()).optional().describe("Tool arguments"),
    }),
  }),
  BaseEventSchema.extend({
    type: z.literal("TOOL_EXECUTED"),
    payload: z.object({
      toolName: z.string().describe("Name of the executed tool"),
      success: z.boolean().describe("Whether execution succeeded"),
      result: z.unknown().optional().describe("Tool execution result"),
    }),
  }),
  BaseEventSchema.extend({
    type: z.literal("ERROR"),
    payload: ErrorPayload,
  }),
  BaseEventSchema.extend({
    type: z.literal("RUN_COMPLETED"),
    payload: z.object({
      status: z.enum(["success", "failed"]).describe("Final run status"),
      summary: z.string().optional().describe("Summary of what was accomplished"),
    }),
  }),
]);

export type SwarmEvent = z.infer<typeof EventSchema>;
export type TEventType = z.infer<typeof EventType>;
