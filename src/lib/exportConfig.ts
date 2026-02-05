import { db, runs, agents, artifacts, events } from "@/db";
import { eq, count } from "drizzle-orm";

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
