import { z } from 'zod';

export const TaskPlanCardSchema = z.object({
  title: z.string().describe('Title of the plan'),
  steps: z.array(z.object({
    id: z.string().describe('Unique step identifier'),
    label: z.string().describe('Human-readable step description'),
    owner: z.enum(['orchestrator', 'researcher', 'builder', 'auditor']).describe('Agent responsible for this step'),
    status: z.enum(['todo', 'doing', 'done', 'blocked']).describe('Current status of the step'),
    notes: z.string().optional().describe('Additional notes about the step'),
  })).describe('List of plan steps'),
});

export const ActionProposalSchema = z.object({
  actionId: z.string().describe('Unique identifier for this action'),
  kind: z.enum(['write_artifact', 'propose_patch', 'apply_patch', 'export_report']).describe('Type of action'),
  title: z.string().describe('Human-readable title of the proposed action'),
  rationale: z.string().describe('Explanation of why this action is needed'),
  risk: z.enum(['low', 'medium', 'high']).describe('Risk level assessment'),
  requiresApproval: z.boolean().describe('Whether this action needs user approval'),
  preview: z.object({
    type: z.enum(['diff', 'artifact', 'none']).describe('Type of preview to show'),
    diff: z.string().optional().describe('Diff content if type is diff'),
    artifactName: z.string().optional().describe('Artifact name if type is artifact'),
  }).describe('Preview data for the action'),
});

export const AuditSummarySchema = z.object({
  overallConfidence: z.enum(['low', 'medium', 'high']).describe('Overall confidence in the results'),
  redFlags: z.array(z.string()).describe('List of potential issues or concerns'),
  verifyChecklist: z.array(z.string()).describe('List of items to manually verify'),
  assumptions: z.array(z.string()).optional().describe('Assumptions made during analysis'),
});

export const ArtifactViewerSchema = z.object({
  id: z.string().describe('Unique artifact identifier'),
  name: z.string().describe('Name of the artifact'),
  content: z.string().describe('The artifact content'),
  agentId: z.string().describe('ID of the agent that created this'),
  createdAt: z.string().describe('ISO timestamp of creation'),
});

export type TaskPlanCard = z.infer<typeof TaskPlanCardSchema>;
export type ActionProposal = z.infer<typeof ActionProposalSchema>;
export type AuditSummary = z.infer<typeof AuditSummarySchema>;
export type ArtifactViewer = z.infer<typeof ArtifactViewerSchema>;
