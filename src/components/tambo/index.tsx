"use client";

import {
  TaskPlanCardSchema,
  ActionProposalSchema,
  AuditSummarySchema,
  ArtifactViewerSchema,
  DiffBeforeActionSchema,
} from "@/lib/schemas";

import TaskPlanCard from "./TaskPlanCard";
import ArtifactViewer from "./ArtifactViewer";
import ActionProposalCard from "./ActionProposalCard";
import DiffBeforeAction from "./DiffBeforeAction";
import AuditSummary from "./AuditSummary";

export { TaskPlanCard, ArtifactViewer, ActionProposalCard, DiffBeforeAction, AuditSummary };

export const tamboComponents = [
  {
    name: "TaskPlanCard",
    description: "Displays a task plan with steps, owners, and progress tracking",
    component: TaskPlanCard,
    propsSchema: TaskPlanCardSchema,
  },
  {
    name: "ArtifactViewer",
    description: "Shows generated artifacts with syntax highlighting and expand/collapse",
    component: ArtifactViewer,
    propsSchema: ArtifactViewerSchema,
  },
  {
    name: "ActionProposalCard",
    description: "Presents an action proposal with risk level and approval buttons",
    component: ActionProposalCard,
    propsSchema: ActionProposalSchema,
  },
  {
    name: "DiffBeforeAction",
    description: "Shows a diff preview before applying changes with proceed/cancel actions",
    component: DiffBeforeAction,
    propsSchema: DiffBeforeActionSchema,
  },
  {
    name: "AuditSummary",
    description: "Displays audit results with confidence level, red flags, and verification checklist",
    component: AuditSummary,
    propsSchema: AuditSummarySchema,
  },
];
