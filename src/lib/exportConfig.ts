import { db, runs, agents, artifacts, events, actionProposals } from "@/db";
import { eq, count, asc } from "drizzle-orm";

interface YAMLExport {
  version: string;
  run: {
    id: string;
    prompt: string;
    status: string;
    createdAt: string;
    completedAt: string | null;
    durationMs: number | null;
  };
  agents: Array<{
    id: string;
    name: string;
    role: string;
    status: string;
    parentId: string | null;
  }>;
  artifacts: Array<{
    id: string;
    name: string;
    contentType: string;
    createdBy: string;
    createdAt: string;
  }>;
  events: {
    total: number;
    byType: Record<string, number>;
  };
}

export async function exportRunAsYAML(runId: string): Promise<string> {
  const run = await db.query.runs.findFirst({
    where: eq(runs.id, runId),
  });

  if (!run) {
    throw new Error(`Run not found: ${runId}`);
  }

  const runAgents = await db
    .select()
    .from(agents)
    .where(eq(agents.runId, runId));

  const runArtifacts = await db
    .select({
      id: artifacts.id,
      name: artifacts.name,
      contentType: artifacts.contentType,
      agentId: artifacts.agentId,
      createdAt: artifacts.createdAt,
    })
    .from(artifacts)
    .where(eq(artifacts.runId, runId));

  const eventCounts = await db
    .select({
      type: events.type,
      count: count(),
    })
    .from(events)
    .where(eq(events.runId, runId))
    .groupBy(events.type);

  const totalEvents = eventCounts.reduce((sum, e) => sum + e.count, 0);
  const eventsByType: Record<string, number> = {};
  for (const e of eventCounts) {
    eventsByType[e.type] = e.count;
  }

  const agentMap = new Map(runAgents.map((a) => [a.id, a.name]));

  const durationMs =
    run.completedAt && run.createdAt
      ? run.completedAt.getTime() - run.createdAt.getTime()
      : null;

  const exportData: YAMLExport = {
    version: "1.0",
    run: {
      id: run.id,
      prompt: run.prompt,
      status: run.status,
      createdAt: run.createdAt.toISOString(),
      completedAt: run.completedAt?.toISOString() ?? null,
      durationMs,
    },
    agents: runAgents.map((a) => ({
      id: a.id,
      name: a.name,
      role: a.role,
      status: a.status,
      parentId: a.parentId,
    })),
    artifacts: runArtifacts.map((a) => ({
      id: a.id,
      name: a.name,
      contentType: a.contentType,
      createdBy: agentMap.get(a.agentId) || a.agentId,
      createdAt: a.createdAt.toISOString(),
    })),
    events: {
      total: totalEvents,
      byType: eventsByType,
    },
  };

  return toYAML(exportData);
}

export async function exportRunAsJSON(runId: string): Promise<string> {
  const run = await db.query.runs.findFirst({
    where: eq(runs.id, runId),
  });

  if (!run) {
    throw new Error(`Run not found: ${runId}`);
  }

  const runAgents = await db
    .select()
    .from(agents)
    .where(eq(agents.runId, runId));

  const runArtifacts = await db
    .select()
    .from(artifacts)
    .where(eq(artifacts.runId, runId));

  const runEvents = await db
    .select()
    .from(events)
    .where(eq(events.runId, runId))
    .orderBy(asc(events.timestamp));

  const runProposals = await db
    .select()
    .from(actionProposals)
    .where(eq(actionProposals.runId, runId));

  const proposalIds = runProposals.map((p) => p.id);
  const runApprovals =
    proposalIds.length > 0
      ? await db.query.approvals.findMany({
          where: (a, { inArray }) => inArray(a.proposalId, proposalIds),
        })
      : [];

  const durationMs =
    run.completedAt && run.createdAt
      ? run.completedAt.getTime() - run.createdAt.getTime()
      : null;

  return JSON.stringify(
    {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      run: {
        id: run.id,
        prompt: run.prompt,
        status: run.status,
        createdAt: run.createdAt.toISOString(),
        completedAt: run.completedAt?.toISOString() ?? null,
        durationMs,
      },
      agents: runAgents.map((a) => ({
        id: a.id,
        name: a.name,
        role: a.role,
        status: a.status,
        parentId: a.parentId,
      })),
      artifacts: runArtifacts.map((a) => ({
        id: a.id,
        name: a.name,
        content: a.content,
        contentType: a.contentType,
        agentId: a.agentId,
        createdAt: a.createdAt.toISOString(),
      })),
      events: runEvents.map((e) => ({
        id: e.id,
        type: e.type,
        agentId: e.agentId,
        payload: e.payload,
        timestamp: e.timestamp.toISOString(),
      })),
      proposals: runProposals.map((p) => ({
        id: p.id,
        agentId: p.agentId,
        kind: p.kind,
        title: p.title,
        rationale: p.rationale,
        risk: p.risk,
        status: p.status,
        diffBefore: p.diffBefore,
        diffAfter: p.diffAfter,
      })),
      approvals: runApprovals.map((a) => ({
        id: a.id,
        proposalId: a.proposalId,
        approved: a.approved,
        reason: a.reason,
        approvedAt: a.approvedAt.toISOString(),
      })),
    },
    null,
    2
  );
}

function toYAML(obj: unknown, indent = 0): string {
  const spaces = "  ".repeat(indent);

  if (obj === null) return "null";
  if (obj === undefined) return "null";
  if (typeof obj === "boolean") return obj.toString();
  if (typeof obj === "number") return obj.toString();
  if (typeof obj === "string") {
    if (obj.includes("\n") || obj.includes(":") || obj.includes("#")) {
      return `"${obj.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";
    return obj
      .map((item) => {
        const value = toYAML(item, indent + 1);
        if (typeof item === "object" && item !== null) {
          return `${spaces}- ${value.trimStart()}`;
        }
        return `${spaces}- ${value}`;
      })
      .join("\n");
  }

  if (typeof obj === "object") {
    const entries = Object.entries(obj);
    if (entries.length === 0) return "{}";
    return entries
      .map(([key, value]) => {
        const yamlValue = toYAML(value, indent + 1);
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          return `${spaces}${key}:\n${yamlValue}`;
        }
        if (Array.isArray(value) && value.length > 0) {
          return `${spaces}${key}:\n${yamlValue}`;
        }
        return `${spaces}${key}: ${yamlValue}`;
      })
      .join("\n");
  }

  return String(obj);
}
