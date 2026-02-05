import { BaseAgent, AgentContext, AgentResult } from "./base";
import { BUILDER_SYSTEM_PROMPT } from "@/lib/llm/prompts";
import { z } from "zod";

const BuildSchema = z.object({
  artifacts: z.array(
    z.object({
      name: z.string(),
      type: z.enum(["document", "code", "copy", "script"]),
      content: z.string(),
      description: z.string(),
    })
  ),
  notes: z.string().optional(),
});

export class BuilderAgent extends BaseAgent {
  constructor(id?: string) {
    super(id || crypto.randomUUID(), "Builder", "builder");
  }

  protected getSystemPrompt(): string {
    return BUILDER_SYSTEM_PROMPT;
  }

  protected async processTask(context: AgentContext): Promise<AgentResult> {
    await this.updateStatus(context.runId, "acting");
    this.emitProgress(context.runId, "Preparing to build artifacts...", { step: "prepare", percentage: 10 });

    const prompt = `Build task: ${context.task}

${context.data ? `Context from research: ${JSON.stringify(context.data)}` : ""}

Create the requested artifacts. Make them:
- Professional and polished
- Engaging and punchy
- Appropriate for the target audience

Respond with JSON matching this structure:
{
  "artifacts": [{"name": "string", "type": "document|code|copy|script", "content": "string", "description": "string"}],
  "notes": "optional notes about the build"
}`;

    try {
      this.emitProgress(context.runId, "Generating content...", { step: "generate", percentage: 30 });
      
      const build = await this.llm.generateStructured<z.infer<typeof BuildSchema>>({
        prompt,
        systemPrompt: this.getSystemPrompt(),
        schema: BuildSchema.shape,
      });

      this.emitProgress(context.runId, `Created ${build.artifacts.length} artifacts, preparing proposals...`, { step: "finalize", percentage: 80 });

      this.emitEvent(context.runId, "AGENT_MESSAGE", {
        summary: `Created ${build.artifacts.length} artifacts`,
      });

      const contentTypeMap: Record<string, string> = {
        document: "text/markdown",
        code: "text/plain",
        copy: "text/plain",
        script: "text/plain",
      };

      return {
        status: "success",
        data: { build },
        artifacts: build.artifacts.map((a) => ({
          name: a.name,
          content: a.content,
          contentType: contentTypeMap[a.type] || "text/plain",
        })),
        proposals: build.artifacts.map((a) => ({
          kind: "write_artifact",
          title: `Create ${a.name}`,
          rationale: a.description,
          risk: "low" as const,
        })),
      };
    } catch (error) {
      return {
        status: "error",
        message: `Build failed: ${error}`,
      };
    }
  }
}
