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
      const plan = await this.llm.generateStructured<z.infer<typeof PlanSchema>>({
        prompt,
        systemPrompt: this.getSystemPrompt(),
        schema: PlanSchema.shape,
      });

      this.emitEvent(context.runId, "AGENT_MESSAGE", {
        summary: `Created plan: ${plan.title} with ${plan.steps.length} steps`,
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
      return {
        status: "error",
        message: `Failed to create plan: ${error}`,
      };
    }
  }
}
