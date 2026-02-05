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

  const edgeData = data as { active?: boolean; color?: string } | undefined;
  const isActive = edgeData?.active ?? false;
  const edgeColor = edgeData?.color ?? "#3b82f6";
  const inactiveColor = "#475569";

  return (
    <>
      {isActive && (
        <path
          d={edgePath}
          style={{
            stroke: edgeColor,
            strokeWidth: 8,
            fill: "none",
            opacity: 0.15,
            filter: `blur(4px)`,
          }}
        />
      )}
      
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          ...style,
          stroke: isActive ? edgeColor : inactiveColor,
          strokeWidth: isActive ? 2.5 : 2,
          fill: "none",
          filter: isActive ? `drop-shadow(0 0 6px ${edgeColor})` : "none",
        }}
        markerEnd={markerEnd}
      />

      {isActive && (
        <g>
          <circle r="5" fill={edgeColor} opacity="0.9">
            <animateMotion dur="1.2s" repeatCount="indefinite">
              <mpath href={`#${id}`} />
            </animateMotion>
          </circle>
          <circle r="3" fill="#ffffff" opacity="0.8">
            <animateMotion dur="1.2s" repeatCount="indefinite">
              <mpath href={`#${id}`} />
            </animateMotion>
          </circle>
          <circle r="5" fill={edgeColor} opacity="0.6">
            <animateMotion dur="1.2s" repeatCount="indefinite" begin="0.4s">
              <mpath href={`#${id}`} />
            </animateMotion>
          </circle>
        </g>
      )}
    </>
  );
}

export default memo(PulseEdge);
