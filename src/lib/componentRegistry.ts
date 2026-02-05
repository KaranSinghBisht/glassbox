"use client";

import { ComponentType } from "react";
import { TEventType } from "./schemas/events";

import ArtifactViewer from "@/components/tambo/ArtifactViewer";
import ActionProposalCard from "@/components/tambo/ActionProposalCard";
import AgentMessageCard from "@/components/tambo/AgentMessageCard";
import ErrorCard from "@/components/tambo/ErrorCard";

// Use ComponentType<any> to allow flexible prop types for registry components.
// Each component has its own typed props, but the registry needs to be flexible.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RegistryComponent = ComponentType<any>;

type ComponentRegistry = {
  [K in TEventType]?: RegistryComponent;
};

const registry: ComponentRegistry = {
  ARTIFACT_CREATED: ArtifactViewer,
  APPROVAL_REQUIRED: ActionProposalCard,
  AGENT_MESSAGE: AgentMessageCard,
  ERROR: ErrorCard,
};

export function getComponentForEvent(
  eventType: TEventType
): RegistryComponent | null {
  return registry[eventType] || null;
}

export function hasComponentForEvent(eventType: TEventType): boolean {
  return eventType in registry;
}

export { registry };
