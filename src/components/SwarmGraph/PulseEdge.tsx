"use client";

import { memo } from "react";
import { EdgeProps, getBezierPath } from "@xyflow/react";

function PulseEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isActive = data?.active ?? false;

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          ...style,
          stroke: isActive ? "#3b82f6" : "#475569",
          strokeWidth: isActive ? 2.5 : 2,
          fill: "none",
          filter: isActive ? "drop-shadow(0 0 4px #3b82f6)" : "none",
        }}
        markerEnd={markerEnd}
      />

      {isActive && (
        <g>
          <circle r="4" fill="#3b82f6">
            <animateMotion dur="1.5s" repeatCount="indefinite">
              <mpath href={`#${id}`} />
            </animateMotion>
          </circle>
        </g>
      )}
    </>
  );
}

export default memo(PulseEdge);
