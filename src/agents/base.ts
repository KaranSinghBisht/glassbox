import { db, agents, artifacts, actionProposals } from "@/db";
import { eq } from "drizzle-orm";
import { eventBus } from "@/lib/eventBus";
import { getAgentLLMClient } from "@/lib/llm";
import { AgentRole, AgentStatusType, TEventType, SwarmEvent } from "@/lib/schemas";
import { waitForApproval } from "@/lib/approvalService";

export interface AgentContext {
  runId: string;
  task: string;
  parentId?: string;
  data?: Record<string, unknown>;
}

export interface AgentResult {
  status: "success" | "error";
  message?: string;
  artifacts?: Array<{ name: string; content: string; contentType?: string }>;
  proposals?: Array<{
    kind: string;
    title: string;
    rationale: string;
    risk: "low" | "medium" | "high" | "critical";
    diffBefore?: string;
    diffAfter?: string;
  }>;
  data?: Record<string, unknown>;
}

export abstract class BaseAgent {
  readonly id: string;
  readonly name: string;
  readonly role: AgentRole;
  protected llm = getAgentLLMClient();

  constructor(id: string, name: string, role: AgentRole) {
    this.id = id;
    this.name = name;
    this.role = role;
  }

  protected abstract getSystemPrompt(): string;
  protected abstract processTask(context: AgentContext): Promise<AgentResult>;

  async spawn(runId: string, parentId?: string): Promise<void> {
    await db.insert(agents).values({
      id: this.id,
      runId,
      name: this.name,
      role: this.role,
      status: "idle",
      parentId,
    });

    this.emitEvent(runId, "AGENT_SPAWNED", {
      name: this.name,
      role: this.role,
      parentId,
    });
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    await this.updateStatus(context.runId, "thinking");

    try {
      const result = await this.processTask(context);

      if (result.status === "error") {
        await this.updateStatus(context.runId, "error");
        this.emitEvent(context.runId, "ERROR", {
          message: result.message || "Agent task failed",
        });
        return result;
      }

      if (result.proposals?.length) {
        const proposalIds = await this.createProposals(context.runId, result.proposals);
        
        await this.updateStatus(context.runId, "waiting");
        
        for (const proposalId of proposalIds) {
          const approval = await waitForApproval(proposalId);
          if (!approval.approved) {
            await this.updateStatus(context.runId, "rejected");
            return { 
              status: "error", 
              message: `Proposal rejected: ${approval.reason || "No reason provided"}` 
            };
          }
        }
        
        await this.updateStatus(context.runId, "acting");
      }

      if (result.artifacts?.length) {
        await this.saveArtifacts(context.runId, result.artifacts);
      }

      await this.updateStatus(context.runId, "done");
      return result;
    } catch (error) {
      await this.updateStatus(context.runId, "error");
      this.emitEvent(context.runId, "ERROR", {
        message: error instanceof Error ? error.message : "Unknown error",
      });
      return { status: "error", message: String(error) };
    }
  }

  protected async updateStatus(runId: string, status: AgentStatusType): Promise<void> {
    await db
      .update(agents)
      .set({ status })
      .where(eq(agents.id, this.id));

    this.emitEvent(runId, "AGENT_STATUS", { status });
  }

  protected emitEvent(
    runId: string,
    type: TEventType,
    payload: Record<string, unknown>
  ): void {
    eventBus.emit({
      type,
      runId,
      agentId: this.id,
      ts: Date.now(),
      payload,
    } as SwarmEvent);
  }

  protected emitProgress(
    runId: string,
    progress: string,
    options?: { percentage?: number; step?: string }
  ): void {
    this.emitEvent(runId, "AGENT_PROGRESS", {
      progress,
      percentage: options?.percentage,
      step: options?.step,
    });
  }

  protected async block(runId: string, reason: string, blockedBy?: string): Promise<void> {
    await this.updateStatus(runId, "blocked");
    this.emitEvent(runId, "AGENT_BLOCKED", { reason, blockedBy });
  }

  protected async escalate(
    runId: string,
    reason: string,
    severity: "warning" | "critical" = "warning"
  ): Promise<void> {
    await this.updateStatus(runId, "escalated");
    this.emitEvent(runId, "AGENT_ESCALATED", { reason, severity });
  }

  protected async saveArtifacts(
    runId: string,
    items: Array<{ name: string; content: string; contentType?: string }>
  ): Promise<void> {
    for (const item of items) {
      const artifactId = crypto.randomUUID();
      await db.insert(artifacts).values({
        id: artifactId,
        runId,
        agentId: this.id,
        name: item.name,
        content: item.content,
        contentType: item.contentType || "text/plain",
      });

      this.emitEvent(runId, "ARTIFACT_CREATED", {
        artifactId,
        name: item.name,
        contentType: item.contentType,
        contentPreview: item.content.slice(0, 100),
      });
    }
  }

  protected async createProposals(
    runId: string,
    items: Array<{
      kind: string;
      title: string;
      rationale: string;
      risk: "low" | "medium" | "high" | "critical";
      diffBefore?: string;
      diffAfter?: string;
    }>
  ): Promise<string[]> {
    const proposalIds: string[] = [];
    
    for (const item of items) {
      const proposalId = crypto.randomUUID();
      const actionId = crypto.randomUUID();

      await db.insert(actionProposals).values({
        id: proposalId,
        runId,
        agentId: this.id,
        actionId,
        kind: item.kind,
        title: item.title,
        rationale: item.rationale,
        risk: item.risk,
        diffBefore: item.diffBefore,
        diffAfter: item.diffAfter,
        status: "pending",
      });

      this.emitEvent(runId, "APPROVAL_REQUIRED", {
        proposalId,
        actionId,
        kind: item.kind,
        title: item.title,
        risk: item.risk,
      });
      
      proposalIds.push(proposalId);
    }
    
    return proposalIds;
  }
}
