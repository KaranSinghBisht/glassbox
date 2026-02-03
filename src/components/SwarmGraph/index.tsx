"use client";

import { useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import AgentNode, { AgentNodeData, AgentStatus } from "./AgentNode";
import PulseEdge from "./PulseEdge";

const nodeTypes = {
  agent: AgentNode,
};

const edgeTypes = {
  pulse: PulseEdge,
};

export interface SwarmGraphProps {
  className?: string;
}

const initialNodes: Node<AgentNodeData>[] = [
  {
    id: "orchestrator",
    type: "agent",
    position: { x: 250, y: 50 },
    data: { label: "Orchestrator", role: "orchestrator", status: "idle" },
  },
];

const initialEdges: Edge[] = [];

export default function SwarmGraph({ className }: SwarmGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const addAgent = useCallback(
    (id: string, label: string, role: string, parentId?: string) => {
      const existingNodes = nodes.length;
      const xOffset = (existingNodes % 3) * 200;
      const yOffset = Math.floor(existingNodes / 3) * 120 + 50;

      const newNode: Node<AgentNodeData> = {
        id,
        type: "agent",
        position: { x: 150 + xOffset, y: yOffset },
        data: { label, role, status: "idle" as AgentStatus },
      };

      setNodes((nds) => [...nds, newNode]);

      if (parentId) {
        const newEdge: Edge = {
          id: `e-${parentId}-${id}`,
          source: parentId,
          target: id,
          type: "pulse",
          data: { active: false },
        };
        setEdges((eds) => [...eds, newEdge]);
      }
    },
    [nodes.length, setNodes, setEdges]
  );

  const updateAgentStatus = useCallback(
    (agentId: string, status: AgentStatus) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === agentId
            ? { ...node, data: { ...node.data, status } }
            : node
        )
      );
    },
    [setNodes]
  );

  const activateEdge = useCallback(
    (sourceId: string, targetId: string, active: boolean) => {
      setEdges((eds) =>
        eds.map((edge) =>
          edge.source === sourceId && edge.target === targetId
            ? { ...edge, data: { ...edge.data, active } }
            : edge
        )
      );
    },
    [setEdges]
  );

  return (
    <div
      className={`w-full h-full ${className || ""}`}
      data-testid="swarm-graph"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#e2e8f0" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as AgentNodeData;
            switch (data?.status) {
              case "thinking":
              case "acting":
                return "#3b82f6";
              case "done":
                return "#10b981";
              case "error":
                return "#ef4444";
              default:
                return "#94a3b8";
            }
          }}
        />
      </ReactFlow>
    </div>
  );
}

export { type AgentStatus, type AgentNodeData };
