import { z } from 'zod';

export const EventType = z.enum([
  'RUN_CREATED',
  'AGENT_SPAWNED', 
  'AGENT_STATUS',
  'AGENT_MESSAGE',
  'TOOL_PROPOSED',
  'APPROVAL_REQUIRED',
  'APPROVAL_GRANTED',
  'TOOL_EXECUTED',
  'ARTIFACT_CREATED',
  'ERROR',
  'RUN_COMPLETED',
]);

export const BaseEventSchema = z.object({
  type: EventType.describe('The type of event'),
  runId: z.string().describe('The ID of the run this event belongs to'),
  ts: z.number().describe('Unix timestamp of when the event occurred'),
  agentId: z.string().optional().describe('The ID of the agent that triggered this event'),
});

export const AgentSpawnedPayload = z.object({
  name: z.string().describe('Human-readable name of the agent'),
  role: z.enum(['orchestrator', 'researcher', 'builder', 'auditor']).describe('The role of the agent'),
});

export const AgentStatusPayload = z.object({
  status: z.enum(['idle', 'thinking', 'waiting', 'acting', 'done', 'error']).describe('Current status of the agent'),
});

export const AgentMessagePayload = z.object({
  to: z.string().optional().describe('ID of the recipient agent'),
  summary: z.string().describe('Brief summary of the message'),
  dataRef: z.string().optional().describe('Reference to associated data (e.g., artifact:landing_page)'),
});

export const ArtifactCreatedPayload = z.object({
  artifactId: z.string().describe('Unique ID of the artifact'),
  name: z.string().describe('Name of the artifact'),
  contentPreview: z.string().optional().describe('Preview of artifact content'),
});

export const EventSchema = BaseEventSchema.extend({
  payload: z.union([
    AgentSpawnedPayload,
    AgentStatusPayload,
    AgentMessagePayload,
    ArtifactCreatedPayload,
    z.record(z.string(), z.unknown()),
  ]).optional(),
});

export type SwarmEvent = z.infer<typeof EventSchema>;
