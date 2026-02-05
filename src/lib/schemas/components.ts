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
  description: z.string().optional().describe("Detailed description of the action"),
  rationale: z.string().describe("Why this action is recommended"),
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

export type TaskPlanCard = z.infer<typeof TaskPlanCardSchema>;
export type ActionProposal = z.infer<typeof ActionProposalSchema>;
export type AuditSummary = z.infer<typeof AuditSummarySchema>;
export type ArtifactViewer = z.infer<typeof ArtifactViewerSchema>;
export type DiffBeforeAction = z.infer<typeof DiffBeforeActionSchema>;
export type AgentMessageCard = z.infer<typeof AgentMessageCardSchema>;
export type ErrorCard = z.infer<typeof ErrorCardSchema>;
