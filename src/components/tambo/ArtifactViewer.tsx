"use client";

import { useState } from "react";
import { ArtifactViewer as ArtifactViewerType } from "@/lib/schemas";
import { Card, Badge, Button } from "@/components/ui/primitives";
import { FileCode, Copy, ChevronDown, ChevronRight, Check } from "lucide-react";

export interface ArtifactViewerProps {
  data: ArtifactViewerType;
}

export default function ArtifactViewer({ data }: ArtifactViewerProps) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const contentType = data.contentType || "text/plain";
  const isCode =
    contentType.includes("javascript") ||
    contentType.includes("typescript") ||
    contentType.includes("json") ||
    contentType.includes("python");

  const extension = data.name.split(".").pop()?.toUpperCase() || "TXT";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(data.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = data.content.split("\n");

  return (
    <Card className="w-full animate-fade-in border-blue-500/20">
      <div className="bg-slate-900/50 p-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-mono text-slate-300">{data.name}</span>
          <Badge variant="outline">{extension}</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="p-4 bg-slate-950/30 overflow-x-auto">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed">
            {lines.map((line, i) => (
              <div key={i} className="flex">
                <span className="text-slate-700 w-8 select-none text-right pr-3">
                  {i + 1}
                </span>
                <span className={isCode ? "text-slate-300" : "text-slate-400"}>
                  {line}
                </span>
              </div>
            ))}
          </pre>
        </div>
      )}
      <div className="px-3 py-2 bg-slate-900/30 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
        <span>by {data.agentId.slice(0, 8)}</span>
        <span>{new Date(data.createdAt).toLocaleTimeString()}</span>
      </div>
    </Card>
  );
}
