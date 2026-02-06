"use client";

import { useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Node,
  Edge,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import AgentNode, { AgentNodeData, AgentStatus } from "./AgentNode";
import PulseEdge from "./PulseEdge";
import { useDagreLayout } from "./useDagreLayout";

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
  focusAgent: (agentId: string) => void;
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

const SwarmGraphInner = forwardRef<SwarmGraphHandle, SwarmGraphProps>(function SwarmGraphInner({ className }, ref) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { getLayoutedElements } = useDagreLayout();
  const reactFlowInstance = useReactFlow();
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  const addAgent = useCallback(
    (id: string, role: string, parentId?: string) => {
      if (nodesRef.current.some((n) => n.id === id)) return;

      const newNode: Node<AgentNodeData> = {
        id,
        type: "agent",
        position: { x: 0, y: 0 },
        data: { label: role, role, status: "idle" as AgentStatus },
      };

      const nextNodes = [...nodesRef.current, newNode];
      const nextEdges = [...edgesRef.current];

      if (parentId) {
        const edgeId = `e-${parentId}-${id}`;
        if (!nextEdges.some((e) => e.id === edgeId)) {
          nextEdges.push({
            id: edgeId,
            source: parentId,
            target: id,
            type: "pulse",
            data: { active: false },
          });
        }
      }

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nextNodes, nextEdges);
      setNodes(layoutedNodes as Node<AgentNodeData>[]);
      setEdges(layoutedEdges);

      // Auto-fit viewport when graph grows
      setTimeout(() => {
        reactFlowInstance.fitView({ duration: 300, padding: 0.2 });
      }, 50);
    },
    [setNodes, setEdges, getLayoutedElements, reactFlowInstance]
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

  const focusAgent = useCallback(
    (agentId: string) => {
      const node = nodesRef.current.find((n) => n.id === agentId);
      if (node) {
        reactFlowInstance.setCenter(
          node.position.x + 90,
          node.position.y + 40,
          { zoom: 1.5, duration: 400 }
        );
        // Briefly highlight by toggling a visual cue via status
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            data: { ...n.data, focused: n.id === agentId },
          }))
        );
        setTimeout(() => {
          setNodes((nds) =>
            nds.map((n) => ({
              ...n,
              data: { ...n.data, focused: false },
            }))
          );
        }, 2000);
      }
    },
    [reactFlowInstance, setNodes]
  );

  useImperativeHandle(ref, () => ({
    addAgent,
    updateAgentStatus,
    activateEdge,
    focusAgent,
  }), [addAgent, updateAgentStatus, activateEdge, focusAgent]);

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
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#334155" gap={20} size={1} />
        <Controls className="!bg-slate-800 !border-slate-700 !rounded-lg [&>button]:!bg-slate-800 [&>button]:!border-slate-700 [&>button]:!text-slate-400 [&>button:hover]:!bg-slate-700" />
        <MiniMap
          className="!bg-slate-900/80 !border-slate-700 !rounded-lg"
          maskColor="rgba(15, 23, 42, 0.7)"
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
              case "waiting":
                return "#f59e0b";
              default:
                return "#475569";
            }
          }}
        />
      </ReactFlow>
    </div>
  );
});

const SwarmGraph = forwardRef<SwarmGraphHandle, SwarmGraphProps>(function SwarmGraph(props, ref) {
  return (
    <ReactFlowProvider>
      <SwarmGraphInner ref={ref} {...props} />
    </ReactFlowProvider>
  );
});

export default SwarmGraph;
export { type AgentStatus, type AgentNodeData };
