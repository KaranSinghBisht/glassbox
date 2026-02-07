import { z } from "zod";

export const TaskPlanCardSchema = z.object({
  title: z.string().describe("Title of the task plan"),
  steps: z
    .array(
      z.object({
        id: z.string().describe("Unique step identifier"),
        label: z.string().describe("Human-readable step description"),
        owner: z
          .enum(["orchestrator", "researcher", "builder", "auditor"])
          .describe("Agent responsible for this step"),
        status: z
          .enum(["todo", "doing", "done", "blocked"])
          .describe("Current status of this step"),
        notes: z.string().optional().describe("Additional notes or context"),
      })
    )
    .describe("List of steps in the plan"),
});

export const ActionProposalSchema = z.object({
  proposalId: z.string().describe("Database ID of the proposal for API calls"),
  actionId: z.string().describe("Unique identifier for this action"),
  kind: z
    .enum(["write_artifact", "propose_patch", "apply_patch", "export_report", "execute_code"])
    .describe("Type of action being proposed"),
  title: z.string().describe("Short title describing the action"),
  description: z.string().optional().default("").describe("Detailed description of the action"),
  rationale: z.string().optional().default("").describe("Why this action is recommended"),
  risk: z
    .enum(["low", "medium", "high", "critical"])
    .describe("Risk level of this action"),
  requiresApproval: z.boolean().describe("Whether user approval is needed"),
  preview: z.object({
    type: z
      .enum(["diff", "artifact", "none"])
      .describe("Type of preview available"),
    diff: z.string().optional().describe("Unified diff preview if applicable"),
    artifactName: z.string().optional().describe("Artifact name if applicable"),
  }).describe("Preview data for the proposed action"),
});

export const AuditSummarySchema = z.object({
  overallConfidence: z
    .enum(["low", "medium", "high"])
    .describe("Overall confidence in the work done"),
  redFlags: z
    .array(z.string())
    .describe("List of potential issues or concerns"),
  verifyChecklist: z
    .array(z.string())
    .describe("List of items to verify before proceeding"),
  assumptions: z
    .array(z.string())
    .optional()
    .describe("Assumptions made during analysis"),
  recommendations: z
    .array(z.string())
    .optional()
    .describe("Recommendations for improvement"),
});

export const ArtifactViewerSchema = z.object({
  id: z.string().describe("Unique artifact identifier"),
  name: z.string().describe("Display name of the artifact"),
  content: z.string().describe("Full content of the artifact"),
  contentType: z.string().optional().describe("MIME type of the content"),
  agentId: z.string().describe("ID of the agent that created this"),
  createdAt: z.string().describe("ISO timestamp of creation"),
});

export const DiffBeforeActionSchema = z.object({
  actionId: z.string().describe("ID of the action this diff belongs to"),
  title: z.string().describe("Title describing what this diff shows"),
  filePath: z.string().optional().describe("File path if applicable"),
  diff: z.string().describe("Unified diff content"),
  risk: z
    .enum(["low", "medium", "high", "critical"])
    .describe("Risk level of applying this diff"),
  linesAdded: z.number().optional().describe("Number of lines added"),
  linesRemoved: z.number().optional().describe("Number of lines removed"),
});

export const AgentMessageCardSchema = z.object({
  summary: z.string().describe("Human-readable message summary"),
  to: z.string().optional().describe("Target agent ID if directed"),
  dataRef: z.string().optional().describe("Reference to associated data"),
});

export const ErrorCardSchema = z.object({
  code: z.string().optional().describe("Error code if available"),
  message: z.string().describe("Error message"),
  stack: z.string().optional().describe("Stack trace if available"),
});

export const RunProgressCardSchema = z.object({
  runId: z.string().describe("ID of the current run"),
  status: z
    .enum(["pending", "running", "completed", "failed"])
    .describe("Current run status"),
  agents: z
    .array(
      z.object({
        id: z.string().describe("Agent ID"),
        name: z.string().describe("Agent display name"),
        role: z.string().describe("Agent role"),
        status: z.string().describe("Current agent status"),
      })
    )
    .optional()
    .describe("List of agents and their statuses"),
  tokenCount: z.number().optional().describe("Total tokens used so far"),
  elapsedMs: z.number().optional().describe("Elapsed time in milliseconds"),
  progress: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe("Overall progress percentage"),
});

export const AgentInspectorSchema = z.object({
  agentId: z.string().describe("ID of the agent to inspect"),
  name: z.string().describe("Agent display name"),
  role: z.string().describe("Agent role"),
  status: z.string().describe("Current agent status"),
  outputs: z
    .array(z.string())
    .optional()
    .describe("List of outputs/artifacts produced"),
  tokenCount: z.number().optional().describe("Tokens consumed by this agent"),
  elapsedMs: z.number().optional().describe("Time spent by this agent in ms"),
  lastMessage: z.string().optional().describe("Last message from this agent"),
});

export const TimelineViewSchema = z.object({
  events: z
    .array(
      z.object({
        type: z.string().describe("Event type"),
        agentId: z.string().optional().describe("Agent that emitted this event"),
        message: z.string().describe("Human-readable summary"),
        timestamp: z.number().describe("Unix timestamp in ms"),
      })
    )
    .describe("Chronological list of events"),
  filterTypes: z
    .array(z.string())
    .optional()
    .describe("Event types to show (empty = all)"),
});

export const MetricsSummarySchema = z.object({
  totalTokens: z.number().describe("Total tokens used"),
  inputTokens: z.number().describe("Input tokens used"),
  outputTokens: z.number().describe("Output tokens used"),
  llmCalls: z.number().describe("Number of LLM calls"),
  estimatedCost: z.number().describe("Estimated cost in USD"),
  agentBreakdown: z
    .array(
      z.object({
        name: z.string().describe("Agent name"),
        role: z.string().describe("Agent role"),
        tokens: z.number().describe("Tokens used by this agent"),
        elapsedMs: z.number().describe("Time spent in ms"),
      })
    )
    .optional()
    .describe("Per-agent token and time breakdown"),
  totalElapsedMs: z.number().optional().describe("Total run time in ms"),
});

export type TaskPlanCard = z.infer<typeof TaskPlanCardSchema>;
export type ActionProposal = z.infer<typeof ActionProposalSchema>;
export type AuditSummary = z.infer<typeof AuditSummarySchema>;
export type ArtifactViewer = z.infer<typeof ArtifactViewerSchema>;
export type DiffBeforeAction = z.infer<typeof DiffBeforeActionSchema>;
export type AgentMessageCard = z.infer<typeof AgentMessageCardSchema>;
export type ErrorCard = z.infer<typeof ErrorCardSchema>;
export type RunProgressCard = z.infer<typeof RunProgressCardSchema>;
export type AgentInspector = z.infer<typeof AgentInspectorSchema>;
export type TimelineView = z.infer<typeof TimelineViewSchema>;
export type MetricsSummary = z.infer<typeof MetricsSummarySchema>;
