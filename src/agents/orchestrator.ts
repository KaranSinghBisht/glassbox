import { BaseAgent, AgentContext, AgentResult } from "./base";
import { ORCHESTRATOR_SYSTEM_PROMPT } from "@/lib/llm/prompts";
import { z } from "zod";

const PlanSchema = z.object({
  title: z.string(),
  steps: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      owner: z.enum(["orchestrator", "researcher", "builder", "auditor"]),
      notes: z.string().optional(),
    })
  ),
  delegations: z.array(
    z.object({
      agent: z.enum(["researcher", "builder", "auditor"]),
      task: z.string(),
      priority: z.number().min(1).max(3),
    })
  ),
});

export class OrchestratorAgent extends BaseAgent {
  constructor(id?: string) {
    super(id || crypto.randomUUID(), "Orchestrator", "orchestrator");
  }

  protected getSystemPrompt(): string {
    return ORCHESTRATOR_SYSTEM_PROMPT;
  }

  protected async processTask(context: AgentContext): Promise<AgentResult> {
    await this.updateStatus(context.runId, "thinking");
    this.emitProgress(context.runId, "Analyzing goal and planning approach...", { step: "analyze", percentage: 10 });

    const prompt = `User goal: ${context.task}

Create a structured plan to accomplish this goal. Include:
1. A title for the plan
2. Step-by-step breakdown with assignments to appropriate agents
3. Delegations specifying which agent should do what

Respond with JSON matching this structure:
{
  "title": "string",
  "steps": [{"id": "string", "label": "string", "owner": "orchestrator|researcher|builder|auditor", "notes": "optional"}],
  "delegations": [{"agent": "researcher|builder|auditor", "task": "string", "priority": 1-3}]
}`;

    try {
      this.emitProgress(context.runId, "Generating execution plan...", { step: "generate", percentage: 30 });
      
      const plan = await this.llm.generateStructured<z.infer<typeof PlanSchema>>({
        prompt,
        systemPrompt: this.getSystemPrompt(),
        schema: PlanSchema.shape,
      });

      this.emitProgress(context.runId, "Plan generated, preparing delegations...", { step: "prepare", percentage: 70 });
      console.log('[Orchestrator] Plan received:', JSON.stringify(plan, null, 2));

      // Validate and fallback if no delegations
      if (!plan.delegations || plan.delegations.length === 0) {
        console.warn('[Orchestrator] No delegations in plan, creating default delegations');
        plan.delegations = [
          { agent: 'researcher', task: `Research and gather context for: ${context.task}`, priority: 1 },
          { agent: 'builder', task: `Create deliverables for: ${context.task}`, priority: 2 },
          { agent: 'auditor', task: `Review the work for: ${context.task}`, priority: 3 },
        ];
      }

      this.emitProgress(context.runId, "Finalizing plan and artifacts...", { step: "finalize", percentage: 90 });
      
      this.emitEvent(context.runId, "AGENT_MESSAGE", {
        summary: `Created plan: ${plan.title} with ${plan.steps.length} steps and ${plan.delegations.length} delegations`,
      });

      return {
        status: "success",
        data: {
          plan,
          delegations: plan.delegations,
        },
        artifacts: [
          {
            name: "task-plan.json",
            content: JSON.stringify(plan, null, 2),
            contentType: "application/json",
          },
        ],
      };
    } catch (error) {
      console.error('[Orchestrator] Failed to create plan:', error);
      return {
        status: "error",
        message: `Failed to create plan: ${error}`,
      };
    }
  }
}
