import { z } from 'zod';

export const TaskPlanCardSchema = z.object({
  title: z.string(),
  steps: z.array(z.object({
    id: z.string(),
    label: z.string(),
    owner: z.enum(['orchestrator', 'researcher', 'builder', 'auditor']),
    status: z.enum(['todo', 'doing', 'done', 'blocked']),
    notes: z.string().optional(),
  })),
});

export const ActionProposalSchema = z.object({
  actionId: z.string(),
  kind: z.enum(['write_artifact', 'propose_patch', 'apply_patch', 'export_report']),
  title: z.string(),
  rationale: z.string(),
  risk: z.enum(['low', 'medium', 'high']),
  requiresApproval: z.boolean(),
  preview: z.object({
    type: z.enum(['diff', 'artifact', 'none']),
    diff: z.string().optional(),
    artifactName: z.string().optional(),
  }),
});

export const AuditSummarySchema = z.object({
  overallConfidence: z.enum(['low', 'medium', 'high']),
  redFlags: z.array(z.string()),
  verifyChecklist: z.array(z.string()),
  assumptions: z.array(z.string()).optional(),
});

export const ArtifactViewerSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  agentId: z.string(),
  createdAt: z.string(),
});

export const DiffBeforeActionSchema = z.object({
  actionId: z.string(),
  title: z.string(),
  filePath: z.string().optional(),
  diff: z.string(),
  risk: z.enum(['low', 'medium', 'high']),
});

export type TaskPlanCard = z.infer<typeof TaskPlanCardSchema>;
export type ActionProposal = z.infer<typeof ActionProposalSchema>;
export type AuditSummary = z.infer<typeof AuditSummarySchema>;
export type ArtifactViewer = z.infer<typeof ArtifactViewerSchema>;
export type DiffBeforeAction = z.infer<typeof DiffBeforeActionSchema>;
