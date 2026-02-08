import { BaseAgent, AgentContext, AgentResult } from "./base";
import { AUDITOR_SYSTEM_PROMPT } from "@/lib/llm/prompts";
import { db, artifacts } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const AuditSchema = z.object({
  confidence: z.enum(["low", "medium", "high"]),
  redFlags: z.array(z.string()),
  recommendations: z.array(z.string()),
  auditReportMarkdown: z.string().min(1),
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

    const runArtifacts = await db
      .select()
      .from(artifacts)
      .where(eq(artifacts.runId, context.runId));

    const prdArtifact = runArtifacts.find((a) => a.name === "Product Requirements Document");

    const prompt = `Audit task: ${context.task}

Research context (if any):
${context.data ? JSON.stringify(context.data) : "(none)"}

PRD to review (markdown):
${prdArtifact ? prdArtifact.content : "(No PRD artifact found yet. If missing, explain what is needed before you can audit.)"}

Conduct a thorough PRD audit and provide:
1. Overall confidence assessment (high/medium/low)
2. Specific red flags or concerns (not generic)
3. Recommendations for improvement (prioritized)
4. Missing edge cases, unclear requirements, and untestable acceptance criteria

Respond with JSON matching this structure:
{
  "confidence": "low|medium|high",
  "redFlags": ["string"],
  "recommendations": ["string"],
  "auditReportMarkdown": "string (full markdown audit report)"
}`;

    try {
      this.emitProgress(context.runId, "Analyzing artifacts and identifying issues...", { step: "analyze", percentage: 30 });
      
      const audit = await this.llm.generateStructured<z.infer<typeof AuditSchema>>({
        prompt,
        systemPrompt: this.getSystemPrompt(),
        schema: AuditSchema.shape,
        zodSchema: AuditSchema,
      });

      this.emitProgress(context.runId, "Compiling audit summary and recommendations...", { step: "compile", percentage: 80 });

      this.emitEvent(context.runId, "AGENT_MESSAGE", {
        summary: `Audit complete: ${audit.confidence} confidence, ${audit.redFlags.length} red flags`,
      });

      return {
        status: "success",
        data: {
          confidence: audit.confidence,
          redFlags: audit.redFlags,
          recommendations: audit.recommendations,
          auditReportMarkdown: audit.auditReportMarkdown,
        },
        artifacts: [
          {
            name: "PRD Audit Report",
            content: audit.auditReportMarkdown,
            contentType: "text/markdown",
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
