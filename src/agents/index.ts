export { BaseAgent, type AgentContext, type AgentResult } from "./base";
export { OrchestratorAgent } from "./orchestrator";
export { ResearcherAgent } from "./researcher";
export { BuilderAgent } from "./builder";
export { AuditorAgent } from "./auditor";

import { OrchestratorAgent } from "./orchestrator";
import { ResearcherAgent } from "./researcher";
import { BuilderAgent } from "./builder";
import { AuditorAgent } from "./auditor";

export function createAgent(role: "orchestrator" | "researcher" | "builder" | "auditor") {
  switch (role) {
    case "orchestrator":
      return new OrchestratorAgent();
    case "researcher":
      return new ResearcherAgent();
    case "builder":
      return new BuilderAgent();
    case "auditor":
      return new AuditorAgent();
  }
}
