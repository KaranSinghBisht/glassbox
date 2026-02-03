import { z } from 'zod';

export const AgentRole = z.enum(['orchestrator', 'researcher', 'builder', 'auditor']);
export const AgentStatus = z.enum(['idle', 'thinking', 'waiting', 'acting', 'done', 'error']);

export const AgentSchema = z.object({
  id: z.string().describe('Unique agent identifier'),
  name: z.string().describe('Human-readable agent name'),
  role: z.enum(['orchestrator', 'researcher', 'builder', 'auditor']).describe('The role this agent plays'),
  status: z.enum(['idle', 'thinking', 'waiting', 'acting', 'done', 'error']).describe('Current status of the agent'),
});

export const AgentInputSchema = z.object({
  runId: z.string().describe('ID of the current run'),
  task: z.string().describe('Task description for the agent'),
  context: z.record(z.string(), z.unknown()).optional(),
});

export const AgentOutputSchema = z.object({
  status: z.enum(['success', 'error']).describe('Execution result status'),
  result: z.unknown().optional().describe('Output data from the agent'),
  artifacts: z.array(z.object({
    name: z.string(),
    content: z.string(),
  })).optional().describe('Artifacts created by the agent'),
  proposals: z.array(z.object({
    actionId: z.string(),
    kind: z.string(),
    title: z.string(),
  })).optional().describe('Action proposals from the agent'),
});

export type Agent = z.infer<typeof AgentSchema>;
export type AgentInput = z.infer<typeof AgentInputSchema>;
export type AgentOutput = z.infer<typeof AgentOutputSchema>;
