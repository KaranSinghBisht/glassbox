"use client";

import { useCallback } from "react";
import { Node, Edge } from "@xyflow/react";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;
const NODE_SEP = 50;
const RANK_SEP = 80;

/**
 * Simple tree layout that replaces dagre.
 * dagre v2's ESM build uses dynamic require() internally which breaks
 * both Turbopack and webpack bundling.
 */
export function useDagreLayout() {
  const getLayoutedElements = useCallback(
    (nodes: Node[], edges: Edge[], direction: "TB" | "LR" = "TB") => {
      if (nodes.length === 0) return { nodes, edges };

      // Build adjacency: parent → children
      const children = new Map<string, string[]>();
      const hasParent = new Set<string>();

      for (const edge of edges) {
        const list = children.get(edge.source) ?? [];
        list.push(edge.target);
        children.set(edge.source, list);
        hasParent.add(edge.target);
      }

      // Find roots (nodes with no incoming edges)
      const roots = nodes.filter((n) => !hasParent.has(n.id));
      if (roots.length === 0) roots.push(nodes[0]);

      // BFS to assign ranks (depth levels)
      const rank = new Map<string, number>();
      const queue = roots.map((r) => ({ id: r.id, depth: 0 }));
      for (const root of roots) rank.set(root.id, 0);

      while (queue.length > 0) {
        const { id, depth } = queue.shift()!;
        for (const child of children.get(id) ?? []) {
          if (!rank.has(child)) {
            rank.set(child, depth + 1);
            queue.push({ id: child, depth: depth + 1 });
          }
        }
      }

      // Assign rank 0 to any disconnected nodes
      for (const node of nodes) {
        if (!rank.has(node.id)) rank.set(node.id, 0);
      }

      // Group nodes by rank
      const ranks = new Map<number, string[]>();
      for (const [id, r] of rank) {
        const list = ranks.get(r) ?? [];
        list.push(id);
        ranks.set(r, list);
      }

      // Position nodes
      const positions = new Map<string, { x: number; y: number }>();
      for (const [r, ids] of ranks) {
        const totalWidth = ids.length * NODE_WIDTH + (ids.length - 1) * NODE_SEP;
        const startX = -totalWidth / 2;

        ids.forEach((id, i) => {
          const x = startX + i * (NODE_WIDTH + NODE_SEP);
          const y = r * (NODE_HEIGHT + RANK_SEP);

          if (direction === "LR") {
            positions.set(id, { x: y, y: x });
          } else {
            positions.set(id, { x, y });
          }
        });
      }

      const layoutedNodes = nodes.map((node) => ({
        ...node,
        position: positions.get(node.id) ?? node.position,
      }));

      return { nodes: layoutedNodes, edges };
    },
    []
  );

  return { getLayoutedElements };
}
