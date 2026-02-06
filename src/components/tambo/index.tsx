"use client";

import {
  TaskPlanCardSchema,
  ActionProposalSchema,
  AuditSummarySchema,
  ArtifactViewerSchema,
  DiffBeforeActionSchema,
  AgentMessageCardSchema,
  ErrorCardSchema,
  RunProgressCardSchema,
  AgentInspectorSchema,
  TimelineViewSchema,
  MetricsSummarySchema,
} from "@/lib/schemas";

import TaskPlanCard from "./TaskPlanCard";
import ArtifactViewer from "./ArtifactViewer";
import ActionProposalCard from "./ActionProposalCard";
import DiffBeforeAction from "./DiffBeforeAction";
import AuditSummary from "./AuditSummary";
import AgentMessageCard from "./AgentMessageCard";
import ErrorCard from "./ErrorCard";
import RunProgressCard from "./RunProgressCard";
import AgentInspector from "./AgentInspector";
import TimelineView from "./TimelineView";
import MetricsSummary from "./MetricsSummary";

export {
  TaskPlanCard,
  ArtifactViewer,
  ActionProposalCard,
  DiffBeforeAction,
  AuditSummary,
  AgentMessageCard,
  ErrorCard,
  RunProgressCard,
  AgentInspector,
  TimelineView,
  MetricsSummary,
};

export const tamboComponents = [
  {
    name: "TaskPlanCard",
    description: "Displays a task plan with steps, owners, and progress tracking. Use when a run starts and the orchestrator creates a plan.",
    component: TaskPlanCard,
    propsSchema: TaskPlanCardSchema,
  },
  {
    name: "ArtifactViewer",
    description: "Shows generated artifacts with syntax highlighting and expand/collapse. Use when an artifact is created by an agent.",
    component: ArtifactViewer,
    propsSchema: ArtifactViewerSchema,
  },
  {
    name: "ActionProposalCard",
    description: "Presents an action proposal with risk level and approval buttons. Use when human approval is required for an agent action.",
    component: ActionProposalCard,
    propsSchema: ActionProposalSchema,
  },
  {
    name: "DiffBeforeAction",
    description: "Shows a diff preview before applying changes with proceed/cancel actions. Use when showing code changes.",
    component: DiffBeforeAction,
    propsSchema: DiffBeforeActionSchema,
  },
  {
    name: "AuditSummary",
    description: "Displays audit results with confidence level, red flags, and verification checklist. Use when a run completes to show final audit.",
    component: AuditSummary,
    propsSchema: AuditSummarySchema,
  },
  {
    name: "AgentMessageCard",
    description: "Displays agent-to-agent messages with optional target and data references.",
    component: AgentMessageCard,
    propsSchema: AgentMessageCardSchema,
  },
  {
    name: "ErrorCard",
    description: "Shows error details with code, message, and expandable stack trace. Use when an error occurs.",
    component: ErrorCard,
    propsSchema: ErrorCardSchema,
  },
  {
    name: "RunProgressCard",
    description: "Shows live run progress with agent statuses, token count, elapsed time, and progress bar. Use to show overall run status and progress.",
    component: RunProgressCard,
    propsSchema: RunProgressCardSchema,
  },
  {
    name: "AgentInspector",
    description: "Detailed agent inspection card showing status, outputs, artifacts, token usage. Use when the user asks about a specific agent or clicks an agent node.",
    component: AgentInspector,
    propsSchema: AgentInspectorSchema,
  },
  {
    name: "TimelineView",
    description: "Chronological event timeline with type filters. Use when the user asks to see what happened during a run or wants a timeline of events.",
    component: TimelineView,
    propsSchema: TimelineViewSchema,
  },
  {
    name: "MetricsSummary",
    description: "Token usage breakdown, agent timing, cost estimate dashboard. Use when a run completes or when the user asks about costs, tokens, or performance metrics.",
    component: MetricsSummary,
    propsSchema: MetricsSummarySchema,
  },
];
