"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { Card, Badge, Button } from "@/components/ui/primitives";

export interface ErrorCardProps {
  data: {
    code?: string;
    message: string;
    stack?: string;
  };
}

export default function ErrorCard({ data }: ErrorCardProps) {
  const { code, message, stack } = data;
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = `${code ? `[${code}] ` : ""}${message}${stack ? `\n\n${stack}` : ""}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-4 border border-red-500/30 bg-red-950/20">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-red-400">Error</span>
              {code && (
                <Badge variant="danger" className="text-xs">
                  {code}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
          <p className="text-sm text-red-300 leading-relaxed font-mono">
            {message}
          </p>
          {stack && (
            <div className="mt-3">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                {expanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                Stack Trace
              </button>
              {expanded && (
                <pre className="mt-2 p-3 rounded-lg bg-slate-900/50 border border-slate-800 text-xs text-slate-400 overflow-x-auto font-mono">
                  {stack}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
