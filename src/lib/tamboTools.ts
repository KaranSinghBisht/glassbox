"use client";

import { defineTool } from "@tambo-ai/react";
import { z } from "zod";

export const inspectAgentTool = defineTool({
  name: "inspectAgent",
  description:
    "Inspect a specific agent to see its status, outputs, token usage, and last message. Use when the user asks about a specific agent like 'show me what the researcher found' or 'what is the builder doing'.",
  inputSchema: z.object({
    agentId: z.string().describe("The ID of the agent to inspect"),
    agentName: z.string().describe("The name of the agent"),
    agentRole: z
      .string()
      .describe("The role of the agent (orchestrator, researcher, builder, auditor)"),
  }),
  tool: async ({ agentId, agentName, agentRole }) => {
    return {
      agentId,
      name: agentName,
      role: agentRole,
      inspectedAt: new Date().toISOString(),
    };
  },
});

export const showTimelineTool = defineTool({
  name: "showTimeline",
  description:
    "Show a chronological timeline of events for the current run. Use when the user asks 'what happened', 'show me the timeline', or 'what events occurred'.",
  inputSchema: z.object({
    filterTypes: z
      .array(z.string())
      .optional()
      .describe("Optional event type filters like AGENT_SPAWNED, ERROR, etc"),
  }),
  tool: async ({ filterTypes }) => {
    return {
      filterTypes: filterTypes || [],
      requestedAt: new Date().toISOString(),
    };
  },
});

export const exportRunTool = defineTool({
  name: "exportRun",
  description:
    "Export the current run data as a downloadable file. Use when the user asks to export, download, or save the run results.",
  inputSchema: z.object({
    runId: z.string().describe("The ID of the run to export"),
    format: z
      .enum(["json", "yaml"])
      .optional()
      .describe("Export format, defaults to yaml"),
  }),
  tool: async ({ runId, format }) => {
    const endpoint =
      format === "json"
        ? `/api/run/${runId}/export?format=json`
        : `/api/run/${runId}/export`;

    if (typeof window !== "undefined") {
      window.open(endpoint, "_blank");
    }

    return {
      exported: true,
      runId,
      format: format || "yaml",
    };
  },
});

export const tamboTools = [inspectAgentTool, showTimelineTool, exportRunTool];
