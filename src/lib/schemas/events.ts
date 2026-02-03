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

export const EventAgentRole = z.enum(['orchestrator', 'researcher', 'builder', 'auditor']);
export const EventAgentStatus = z.enum(['idle', 'thinking', 'waiting', 'acting', 'done', 'error']);

export const BaseEventSchema = z.object({
  type: EventType,
  runId: z.string(),
  ts: z.number(),
  agentId: z.string().optional(),
});

export const AgentSpawnedPayload = z.object({
  name: z.string(),
  role: EventAgentRole,
});

export const AgentStatusPayload = z.object({
  status: EventAgentStatus,
});

export const AgentMessagePayload = z.object({
  to: z.string().optional(),
  summary: z.string(),
  dataRef: z.string().optional(),
});

export const ArtifactCreatedPayload = z.object({
  artifactId: z.string(),
  name: z.string(),
  contentPreview: z.string().optional(),
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
export type TEventType = z.infer<typeof EventType>;
