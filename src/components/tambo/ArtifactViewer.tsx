"use client";

import { useState } from "react";
import { ArtifactViewer as ArtifactViewerType } from "@/lib/schemas";

export interface ArtifactViewerProps {
  data: ArtifactViewerType;
}

export default function ArtifactViewer({ data }: ArtifactViewerProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = data.content.length > 500;
  const displayContent = expanded ? data.content : data.content.slice(0, 500);

  const contentType = data.contentType || "text/plain";
  const isCode =
    contentType.includes("javascript") ||
    contentType.includes("typescript") ||
    contentType.includes("json") ||
    contentType.includes("python");

  return (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📄</span>
          <div>
            <h3 className="font-semibold text-sm text-slate-800">{data.name}</h3>
            <span className="text-[10px] text-slate-500">
              by {data.agentId} • {new Date(data.createdAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
        {contentType && (
          <span className="text-[10px] px-2 py-1 bg-slate-200 rounded text-slate-600">
            {contentType}
          </span>
        )}
      </div>

      <div className="p-4">
        <pre
          className={`text-sm overflow-x-auto ${
            isCode
              ? "bg-slate-900 text-slate-100 p-3 rounded"
              : "text-slate-700 whitespace-pre-wrap"
          }`}
        >
          <code>{displayContent}</code>
          {isLong && !expanded && "..."}
        </pre>

        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>
    </div>
  );
}
