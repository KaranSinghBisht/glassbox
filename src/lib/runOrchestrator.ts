import { db, runs, agents as agentsTable, actionProposals } from "@/db";
import { eq, and, ne } from "drizzle-orm";
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

const AGENT_TIMEOUT_MS = 5 * 60 * 1000;
const activeRuns = new Map<string, AbortController>();

export function cancelRun(runId: string): boolean {
  const controller = activeRuns.get(runId);
  if (controller) {
    controller.abort();
    activeRuns.delete(runId);
    return true;
  }
  return false;
}

export class RunOrchestrator {
  private runId: string;
  private prompt: string;
  private abortController: AbortController;

  constructor(runId: string, prompt: string) {
    this.runId = runId;
    this.prompt = prompt;
    this.abortController = new AbortController();
  }

  private checkCancelled(): void {
    if (this.abortController.signal.aborted) {
      throw new Error("Run cancelled by user");
    }
  }

  async execute(): Promise<void> {
    activeRuns.set(this.runId, this.abortController);

    try {
      await this.updateStatus("running");
      this.checkCancelled();

      const orchestrator = new OrchestratorAgent();
      await orchestrator.spawn(this.runId);

      const planResult = await orchestrator.execute({
        runId: this.runId,
        task: this.prompt,
      });

      this.checkCancelled();

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
        this.checkCancelled();

        const agent = createAgent(delegation.agent);
        await agent.spawn(this.runId, orchestrator.id);

        let result;
        try {
          result = await Promise.race([
            agent.execute({
              runId: this.runId,
              task: delegation.task,
              parentId: orchestrator.id,
              data: researchData,
            }),
            new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error(`Agent ${delegation.agent} timed out after ${AGENT_TIMEOUT_MS / 1000}s`)),
                AGENT_TIMEOUT_MS
              )
            ),
          ]);
        } catch (agentError) {
          hasFailure = true;
          failedAgents.push(`${delegation.agent}: ${agentError instanceof Error ? agentError.message : "unknown error"}`);
          continue;
        }

        this.checkCancelled();

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
      const isCancelled = this.abortController.signal.aborted;
      await this.updateStatus("failed");

      await db
        .update(agentsTable)
        .set({ status: "error" })
        .where(
          and(
            eq(agentsTable.runId, this.runId),
            ne(agentsTable.status, "done"),
            ne(agentsTable.status, "error")
          )
        );

      await db
        .update(actionProposals)
        .set({ status: "expired" })
        .where(
          and(
            eq(actionProposals.runId, this.runId),
            eq(actionProposals.status, "pending")
          )
        );

      eventBus.emit({
        type: "ERROR",
        runId: this.runId,
        ts: Date.now(),
        payload: {
          code: isCancelled ? "RUN_CANCELLED" : "RUN_EXECUTION_FAILED",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      });

      eventBus.emit({
        type: "RUN_COMPLETED",
        runId: this.runId,
        ts: Date.now(),
        payload: {
          status: "failed",
          summary: isCancelled
            ? "Run cancelled by user"
            : error instanceof Error ? error.message : "Unknown error",
        },
      });

      throw error;
    } finally {
      activeRuns.delete(this.runId);
      eventBus.clearRun(this.runId);
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

export async function createRun(prompt: string): Promise<string> {
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

  return runId;
}

export function startRun(runId: string, prompt: string): void {
  const orchestrator = new RunOrchestrator(runId, prompt);

  orchestrator.execute().catch((error) => {
    console.error(`[Run ${runId}] Failed:`, error);
  });
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
