import { BaseAgent, AgentContext, AgentResult } from "./base";
import { RESEARCHER_SYSTEM_PROMPT } from "@/lib/llm/prompts";
import { z } from "zod";

const ResearchSchema = z.object({
  findings: z.array(
    z.object({
      topic: z.string(),
      summary: z.string(),
      confidence: z.enum(["low", "medium", "high"]),
      sources: z.array(z.string()).optional(),
    })
  ),
  assumptions: z.array(z.string()),
  constraints: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export class ResearcherAgent extends BaseAgent {
  constructor(id?: string) {
    super(id || crypto.randomUUID(), "Researcher", "researcher");
  }

  protected getSystemPrompt(): string {
    return RESEARCHER_SYSTEM_PROMPT;
  }

  protected async processTask(context: AgentContext): Promise<AgentResult> {
    await this.updateStatus(context.runId, "thinking");
    this.emitProgress(context.runId, "Analyzing research requirements...", { step: "analyze", percentage: 10 });

    const prompt = `Research task: ${context.task}

${context.data ? `Additional context: ${JSON.stringify(context.data)}` : ""}

Conduct research and provide:
1. Key findings with confidence levels
2. Assumptions being made
3. Constraints to consider
4. Recommendations for the Builder agent

Respond with JSON matching this structure:
{
  "findings": [{"topic": "string", "summary": "string", "confidence": "low|medium|high", "sources": ["optional"]}],
  "assumptions": ["string"],
  "constraints": ["string"],
  "recommendations": ["string"]
}`;

    try {
      this.emitProgress(context.runId, "Gathering context and constraints...", { step: "gather", percentage: 30 });
      
      const research = await this.llm.generateStructured<z.infer<typeof ResearchSchema>>({
        prompt,
        systemPrompt: this.getSystemPrompt(),
        schema: ResearchSchema.shape,
      });

      this.emitProgress(context.runId, "Compiling findings and recommendations...", { step: "compile", percentage: 80 });

      this.emitEvent(context.runId, "AGENT_MESSAGE", {
        summary: `Found ${research.findings.length} findings, ${research.recommendations.length} recommendations`,
      });

      return {
        status: "success",
        data: { research },
        artifacts: [
          {
            name: "research-findings.json",
            content: JSON.stringify(research, null, 2),
            contentType: "application/json",
          },
        ],
      };
    } catch (error) {
      return {
        status: "error",
        message: `Research failed: ${error}`,
      };
    }
  }
}
