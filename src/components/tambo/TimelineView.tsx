"use client";

import { useState } from "react";
import { TimelineView as TimelineViewType } from "@/lib/schemas";
import { useTamboStreamStatus } from "@tambo-ai/react";
import { Card, Badge, cn } from "@/components/ui/primitives";
import { Clock, Filter } from "lucide-react";

export interface TimelineViewProps {
  data: TimelineViewType;
}

const typeColors: Record<string, { bg: string; text: string; dot: string }> = {
  AGENT_SPAWNED: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-500" },
  AGENT_STATUS: { bg: "bg-violet-500/10", text: "text-violet-400", dot: "bg-violet-500" },
  AGENT_MESSAGE: { bg: "bg-cyan-500/10", text: "text-cyan-400", dot: "bg-cyan-500" },
  AGENT_PROGRESS: { bg: "bg-indigo-500/10", text: "text-indigo-400", dot: "bg-indigo-500" },
  ARTIFACT_CREATED: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-500" },
  APPROVAL_REQUIRED: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-500" },
  ERROR: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-500" },
  RUN_COMPLETED: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-500" },
  RUN_CREATED: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-500" },
};

const defaultColors = { bg: "bg-slate-500/10", text: "text-slate-400", dot: "bg-slate-500" };

export default function TimelineView({ data }: TimelineViewProps) {
  const { streamStatus } = useTamboStreamStatus<TimelineViewType>();
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  if (streamStatus.isPending) {
    return (
      <Card className="p-4 animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-1/3 mb-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 mb-3">
            <div className="w-2 h-2 bg-slate-800 rounded-full mt-1.5" />
            <div className="flex-1">
              <div className="h-3 bg-slate-800 rounded w-3/4 mb-1" />
              <div className="h-3 bg-slate-800 rounded w-1/2" />
            </div>
          </div>
        ))}
      </Card>
    );
  }

  const events = data?.events || [];
  const eventTypes = [...new Set(events.map((e) => e.type))];
  const filtered = activeFilter
    ? events.filter((e) => e.type === activeFilter)
    : events;

  return (
    <Card className="p-0 overflow-hidden animate-fade-in">
      <div className="p-3 border-b border-white/5 bg-slate-900/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-slate-100 text-sm">Timeline</h3>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {filtered.length} events
          </Badge>
        </div>

        {eventTypes.length > 1 && (
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setActiveFilter(null)}
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors",
                !activeFilter
                  ? "bg-blue-500/20 text-blue-300"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Filter className="w-2.5 h-2.5 inline mr-1" />
              All
            </button>
            {eventTypes.map((type) => {
              const colors = typeColors[type] || defaultColors;
              return (
                <button
                  key={type}
                  onClick={() =>
                    setActiveFilter(activeFilter === type ? null : type)
                  }
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors",
                    activeFilter === type
                      ? `${colors.bg} ${colors.text}`
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  {type.replace(/_/g, " ")}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {filtered.map((event, i) => {
          const colors = typeColors[event.type] || defaultColors;
          const isLast = i === filtered.length - 1;

          return (
            <div
              key={`${event.type}-${event.timestamp}-${i}`}
              className="relative flex gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors"
            >
              <div className="flex flex-col items-center">
                <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", colors.dot)} />
                {!isLast && <div className="w-px flex-1 bg-white/5 mt-1" />}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="default"
                    className={cn("text-[9px]", colors.bg, colors.text)}
                  >
                    {event.type.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-[10px] font-mono text-slate-600 shrink-0">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  {event.message}
                </p>
                {event.agentId && (
                  <span className="text-[10px] font-mono text-slate-600">
                    agent: {event.agentId.slice(0, 8)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
