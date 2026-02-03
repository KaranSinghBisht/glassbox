import { z } from 'zod';

export const AgentRoleSchema = z.enum(['orchestrator', 'researcher', 'builder', 'auditor']);
export const AgentStatusSchema = z.enum(['idle', 'thinking', 'waiting', 'acting', 'done', 'error']);

export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: AgentRoleSchema,
  status: AgentStatusSchema,
});

export const AgentInputSchema = z.object({
  runId: z.string(),
  task: z.string(),
  context: z.record(z.string(), z.unknown()).optional(),
});

export const AgentOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  result: z.unknown().optional(),
  artifacts: z.array(z.object({
    name: z.string(),
    content: z.string(),
  })).optional(),
  proposals: z.array(z.object({
    actionId: z.string(),
    kind: z.string(),
    title: z.string(),
  })).optional(),
});

export type Agent = z.infer<typeof AgentSchema>;
export type AgentRole = z.infer<typeof AgentRoleSchema>;
export type AgentStatusType = z.infer<typeof AgentStatusSchema>;
export type AgentInput = z.infer<typeof AgentInputSchema>;
export type AgentOutput = z.infer<typeof AgentOutputSchema>;
