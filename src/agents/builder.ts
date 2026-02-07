import { BaseAgent, AgentContext, AgentResult } from "./base";
import { BUILDER_SYSTEM_PROMPT } from "@/lib/llm/prompts";

export class BuilderAgent extends BaseAgent {
  constructor(id?: string) {
    super(id || crypto.randomUUID(), "Builder", "builder");
  }

  protected getSystemPrompt(): string {
    return BUILDER_SYSTEM_PROMPT;
  }

  private stripMarkdownFences(text: string): string {
    const trimmed = text.trim();
    const fenceMatch = trimmed.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```\s*$/);
    return fenceMatch ? fenceMatch[1].trim() : trimmed;
  }

  protected async processTask(context: AgentContext): Promise<AgentResult> {
    await this.updateStatus(context.runId, "acting");
    this.emitProgress(context.runId, "Preparing to build artifacts...", { step: "prepare", percentage: 10 });

    const researchBrief =
      (context.data?.researchBriefMarkdown as string | undefined) ||
      (context.data?.research as { researchBriefMarkdown?: string } | undefined)?.researchBriefMarkdown;

    const prompt = `Build task: ${context.task}

Research Brief (markdown):
${researchBrief ? researchBrief : "(none provided)"}

Write a SINGLE comprehensive Product Requirements Document (PRD) in markdown.

Hard requirements:
- Include all required sections with '##' headers, in this exact order:
  1. Executive Summary
  2. Problem Statement
  3. Target Users & Personas
  4. User Stories & Use Cases
  5. Functional Requirements
  6. Non-Functional Requirements
  7. Success Metrics & KPIs
  8. Scope & Non-Goals
  9. Risks & Mitigations
  10. Timeline & Milestones
- Each section must be substantive (3-8 sentences minimum; avoid one-liners)
- Add provenance notes where research informed a section, using blockquotes like:
  > Informed by research findings on [topic]

IMPORTANT: Return ONLY the raw markdown PRD. Do NOT wrap in JSON or code fences.
Start directly with the first heading.`;

    try {
      this.emitProgress(context.runId, "Generating PRD...", { step: "generate", percentage: 30 });

      const rawResponse = await this.llm.generate({
        prompt,
        systemPrompt: this.getSystemPrompt(),
        cache: false,
      });

      const prdMarkdown = this.stripMarkdownFences(rawResponse);

      if (prdMarkdown.length < 800) {
        return {
          status: "error",
          message: `PRD too short (${prdMarkdown.length} chars). Expected >= 800 chars of substantive content.`,
        };
      }

      this.emitProgress(context.runId, "PRD created, preparing proposal...", { step: "finalize", percentage: 80 });

      this.emitEvent(context.runId, "AGENT_MESSAGE", {
        summary: "Created PRD",
      });

      return {
        status: "success",
        data: { prdMarkdown },
        artifacts: [
          {
            name: "Product Requirements Document",
            content: prdMarkdown,
            contentType: "text/markdown",
          },
        ],
        proposals: [
          {
            kind: "write_artifact",
            title: "Create Product Requirements Document",
            rationale: "Persist the PRD as a single markdown artifact for review and implementation.",
            risk: "low" as const,
          },
        ],
      };
    } catch (error) {
      return {
        status: "error",
        message: `Build failed: ${error}`,
      };
    }
  }
}
