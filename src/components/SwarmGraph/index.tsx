"use client";

import { useCallback, forwardRef, useImperativeHandle } from "react";
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

export interface SwarmGraphHandle {
  addAgent: (id: string, role: string, parentId?: string) => void;
  updateAgentStatus: (agentId: string, status: AgentStatus) => void;
  activateEdge: (sourceId: string, targetId: string, active?: boolean) => void;
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

const SwarmGraph = forwardRef<SwarmGraphHandle, SwarmGraphProps>(function SwarmGraph({ className }, ref) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const addAgent = useCallback(
    (id: string, role: string, parentId?: string) => {
      // Idempotent: skip if node already exists
      setNodes((nds) => {
        if (nds.some((n) => n.id === id)) return nds;
        
        const existingNodes = nds.length;
        const xOffset = (existingNodes % 3) * 200;
        const yOffset = Math.floor(existingNodes / 3) * 120 + 50;

        const newNode: Node<AgentNodeData> = {
          id,
          type: "agent",
          position: { x: 150 + xOffset, y: yOffset },
          data: { label: role, role, status: "idle" as AgentStatus },
        };

        return [...nds, newNode];
      });

      if (parentId) {
        setEdges((eds) => {
          const edgeId = `e-${parentId}-${id}`;
          if (eds.some((e) => e.id === edgeId)) return eds;
          
          const newEdge: Edge = {
            id: edgeId,
            source: parentId,
            target: id,
            type: "pulse",
            data: { active: false },
          };
          return [...eds, newEdge];
        });
      }
    },
    [setNodes, setEdges]
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
    (sourceId: string, targetId: string, active: boolean = true) => {
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

  useImperativeHandle(ref, () => ({
    addAgent,
    updateAgentStatus,
    activateEdge,
  }), [addAgent, updateAgentStatus, activateEdge]);

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
});

export default SwarmGraph;
export { type AgentStatus, type AgentNodeData };
