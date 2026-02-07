import { BaseAgent, AgentContext, AgentResult } from "./base";
import { RESEARCHER_SYSTEM_PROMPT } from "@/lib/llm/prompts";

export class ResearcherAgent extends BaseAgent {
  constructor(id?: string) {
    super(id || crypto.randomUUID(), "Researcher", "researcher");
  }

  protected getSystemPrompt(): string {
    return RESEARCHER_SYSTEM_PROMPT;
  }

  private stripMarkdownFences(text: string): string {
    const trimmed = text.trim();
    const fenceMatch = trimmed.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```\s*$/);
    return fenceMatch ? fenceMatch[1].trim() : trimmed;
  }

  protected async processTask(context: AgentContext): Promise<AgentResult> {
    await this.updateStatus(context.runId, "thinking");
    this.emitProgress(context.runId, "Analyzing research requirements...", { step: "analyze", percentage: 10 });

    const prompt = `Research task: ${context.task}

${context.data ? `Additional context: ${JSON.stringify(context.data)}` : ""}

Analyze the user's product idea and produce a substantive Research Brief in MARKDOWN.

Your brief must include, at minimum:
- Target users & personas (at least 2, with goals, pains, and context)
- Market context & positioning
- Competitors/alternatives (direct + indirect)
- Constraints (technical, privacy/legal, operational)
- Key risks and assumptions (with suggested validations/mitigations)

Write in complete sentences and make it decision-useful for writing a PRD.

IMPORTANT: Return ONLY the raw markdown Research Brief. Do NOT wrap in JSON or code fences.
Start directly with the first heading.`;

    try {
      this.emitProgress(context.runId, "Gathering context and constraints...", { step: "gather", percentage: 30 });

      const rawResponse = await this.llm.generate({
        prompt,
        systemPrompt: this.getSystemPrompt(),
        cache: false,
      });

      const researchBriefMarkdown = this.stripMarkdownFences(rawResponse);

      if (researchBriefMarkdown.length < 200) {
        return {
          status: "error",
          message: `Research brief too short (${researchBriefMarkdown.length} chars). Expected >= 200 chars.`,
        };
      }

      this.emitProgress(context.runId, "Compiling findings and recommendations...", { step: "compile", percentage: 80 });

      this.emitEvent(context.runId, "AGENT_MESSAGE", {
        summary: "Research brief created",
      });

      return {
        status: "success",
        data: { researchBriefMarkdown },
        artifacts: [
          {
            name: "Research Brief",
            content: researchBriefMarkdown,
            contentType: "text/markdown",
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
