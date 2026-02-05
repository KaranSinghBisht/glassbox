import { BaseAgent, AgentContext, AgentResult } from "./base";
import { AUDITOR_SYSTEM_PROMPT } from "@/lib/llm/prompts";
import { z } from "zod";

const AuditSchema = z.object({
  overallConfidence: z.enum(["low", "medium", "high"]),
  redFlags: z.array(z.string()),
  verifyChecklist: z.array(z.string()),
  assumptions: z.array(z.string()),
  recommendations: z.array(z.string()),
  artifactReviews: z.array(
    z.object({
      artifactName: z.string(),
      score: z.number().min(1).max(10),
      issues: z.array(z.string()),
      suggestions: z.array(z.string()),
    })
  ),
});

export class AuditorAgent extends BaseAgent {
  constructor(id?: string) {
    super(id || crypto.randomUUID(), "Auditor", "auditor");
  }

  protected getSystemPrompt(): string {
    return AUDITOR_SYSTEM_PROMPT;
  }

  protected async processTask(context: AgentContext): Promise<AgentResult> {
    await this.updateStatus(context.runId, "thinking");
    this.emitProgress(context.runId, "Reviewing submitted work...", { step: "review", percentage: 10 });

    const prompt = `Audit task: ${context.task}

${context.data ? `Artifacts to review: ${JSON.stringify(context.data)}` : ""}

Conduct a thorough audit and provide:
1. Overall confidence assessment
2. Any red flags or concerns
3. Verification checklist for the user
4. Assumptions being made
5. Recommendations for improvement
6. Individual artifact reviews with scores

Respond with JSON matching this structure:
{
  "overallConfidence": "low|medium|high",
  "redFlags": ["string"],
  "verifyChecklist": ["string"],
  "assumptions": ["string"],
  "recommendations": ["string"],
  "artifactReviews": [{"artifactName": "string", "score": 1-10, "issues": ["string"], "suggestions": ["string"]}]
}`;

    try {
      this.emitProgress(context.runId, "Analyzing artifacts and identifying issues...", { step: "analyze", percentage: 30 });
      
      const audit = await this.llm.generateStructured<z.infer<typeof AuditSchema>>({
        prompt,
        systemPrompt: this.getSystemPrompt(),
        schema: AuditSchema.shape,
      });

      this.emitProgress(context.runId, "Compiling audit summary and recommendations...", { step: "compile", percentage: 80 });

      this.emitEvent(context.runId, "AGENT_MESSAGE", {
        summary: `Audit complete: ${audit.overallConfidence} confidence, ${audit.redFlags.length} red flags`,
      });

      return {
        status: "success",
        data: { audit },
        artifacts: [
          {
            name: "audit-summary.json",
            content: JSON.stringify(audit, null, 2),
            contentType: "application/json",
          },
        ],
      };
    } catch (error) {
      return {
        status: "error",
        message: `Audit failed: ${error}`,
      };
    }
  }
}
