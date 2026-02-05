"use client";

import { MessageSquare, ArrowRight } from "lucide-react";
import { Card, Badge } from "@/components/ui/primitives";

export interface AgentMessageCardProps {
  data: {
    summary: string;
    to?: string;
    dataRef?: string;
  };
}

export default function AgentMessageCard({ data }: AgentMessageCardProps) {
  const { summary, to, dataRef } = data;

  return (
    <Card className="p-4 border border-slate-800 bg-slate-900/50">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-slate-200">
              Agent Message
            </span>
            {to && (
              <>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <Badge variant="outline">{to}</Badge>
              </>
            )}
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">{summary}</p>
          {dataRef && (
            <div className="mt-2">
              <Badge variant="default" className="text-xs">
                ref: {dataRef}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
