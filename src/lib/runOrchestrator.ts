import { db, runs } from "@/db";
import { eq } from "drizzle-orm";
import { eventBus } from "./eventBus";
import {
  OrchestratorAgent,
  createAgent,
} from "@/agents";

interface Delegation {
  agent: "researcher" | "builder" | "auditor";
  task: string;
  priority: number;
}

export class RunOrchestrator {
  private runId: string;
  private prompt: string;

  constructor(runId: string, prompt: string) {
    this.runId = runId;
    this.prompt = prompt;
  }

  static async create(prompt: string): Promise<RunOrchestrator> {
    const runId = crypto.randomUUID();

    await db.insert(runs).values({
      id: runId,
      prompt,
      status: "pending",
    });

    eventBus.emit({
      type: "RUN_CREATED",
      runId,
      ts: Date.now(),
      payload: { prompt },
    });

    return new RunOrchestrator(runId, prompt);
  }

  async execute(): Promise<void> {
    try {
      await this.updateStatus("running");

      const orchestrator = new OrchestratorAgent();
      await orchestrator.spawn(this.runId);

      const planResult = await orchestrator.execute({
        runId: this.runId,
        task: this.prompt,
      });

      if (planResult.status === "error") {
        throw new Error(planResult.message);
      }

      const delegations = (planResult.data?.delegations as Delegation[]) || [];
      const sortedDelegations = [...delegations].sort(
        (a, b) => a.priority - b.priority
      );

      let researchData: Record<string, unknown> = {};
      let hasFailure = false;
      const failedAgents: string[] = [];

      for (const delegation of sortedDelegations) {
        const agent = createAgent(delegation.agent);
        await agent.spawn(this.runId, orchestrator.id);

        const result = await agent.execute({
          runId: this.runId,
          task: delegation.task,
          parentId: orchestrator.id,
          data: researchData,
        });

        if (result.status === "error") {
          hasFailure = true;
          failedAgents.push(`${delegation.agent}: ${result.message || "unknown error"}`);
        } else if (result.data && delegation.agent === "researcher") {
          researchData = { ...researchData, ...result.data };
        }
      }

      if (hasFailure) {
        throw new Error(`Agent(s) failed: ${failedAgents.join("; ")}`);
      }

      await this.updateStatus("completed");

      eventBus.emit({
        type: "RUN_COMPLETED",
        runId: this.runId,
        ts: Date.now(),
        payload: {
          status: "success",
          summary: `Completed with ${delegations.length} agent tasks`,
        },
      });
    } catch (error) {
      await this.updateStatus("failed");

      eventBus.emit({
        type: "ERROR",
        runId: this.runId,
        ts: Date.now(),
        payload: {
          code: "RUN_EXECUTION_FAILED",
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        },
      });

      eventBus.emit({
        type: "RUN_COMPLETED",
        runId: this.runId,
        ts: Date.now(),
        payload: {
          status: "failed",
          summary: error instanceof Error ? error.message : "Unknown error",
        },
      });

      throw error;
    }
  }

  private async updateStatus(
    status: "pending" | "running" | "completed" | "failed"
  ): Promise<void> {
    const updates: Record<string, unknown> = { status };
    if (status === "completed" || status === "failed") {
      updates.completedAt = new Date();
    }

    await db.update(runs).set(updates).where(eq(runs.id, this.runId));
  }

  getRunId(): string {
    return this.runId;
  }
}

export async function startRun(prompt: string): Promise<string> {
  const orchestrator = await RunOrchestrator.create(prompt);

  orchestrator.execute().catch((error) => {
    console.error("Run failed:", error);
  });

  return orchestrator.getRunId();
}

export async function getRun(runId: string) {
  return db.query.runs.findFirst({
    where: eq(runs.id, runId),
  });
}

export async function getRunWithAgents(runId: string) {
  const run = await db.query.runs.findFirst({
    where: eq(runs.id, runId),
    with: {
      agents: true,
      artifacts: true,
      events: {
        orderBy: (events, { asc }) => [asc(events.timestamp)],
      },
    },
  });

  return run;
}
