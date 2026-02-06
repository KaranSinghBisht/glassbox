"use client";

import { useRef, useEffect } from "react";
import {
  useTambo,
  useTamboSuggestions,
  useTamboThread,
  useTamboThreadList,
} from "@tambo-ai/react";
import { Zap, Loader2, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/components/ui/primitives";

function StreamingIndicator({ stage }: { stage: string }) {
  const labels: Record<string, string> = {
    CHOOSING_COMPONENT: "Selecting component...",
    FETCHING_CONTEXT: "Fetching context...",
    HYDRATING_COMPONENT: "Generating props...",
    STREAMING_RESPONSE: "Streaming...",
  };

  const label = labels[stage] || "Processing...";

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 animate-fade-in">
      <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
      <span className="text-xs text-blue-300 font-medium">{label}</span>
    </div>
  );
}

function ThreadSidebar() {
  const { data: threads, isPending } = useTamboThreadList();
  const { thread, switchCurrentThread } = useTamboThread();

  if (isPending || !threads?.items?.length) return null;

  // Only show if there are multiple threads
  if (threads.items.length <= 1) return null;

  return (
    <div className="border-b border-white/5 bg-slate-900/50 p-2 animate-fade-in">
      <div className="flex items-center gap-1.5 mb-1 px-1">
        <Clock className="w-3 h-3 text-slate-500" />
        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
          History
        </span>
      </div>
      <div className="flex gap-1 overflow-x-auto scrollbar-thin">
        {threads.items.slice(0, 5).map((t) => (
          <button
            key={t.id}
            onClick={() => switchCurrentThread(t.id)}
            className={cn(
              "shrink-0 px-2 py-1 rounded text-[10px] transition-colors truncate max-w-[120px]",
              thread?.id === t.id
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
            )}
          >
            <ChevronRight className="w-2.5 h-2.5 inline mr-0.5" />
            {t.name || `Thread ${t.id.slice(0, 6)}`}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TamboThread() {
  const { thread } = useTambo();
  const { generationStage } = useTamboThread();
  const { suggestions, accept } = useTamboSuggestions({ maxSuggestions: 3 });
  const scrollRef = useRef<HTMLDivElement>(null);

  const isStreaming =
    generationStage !== "IDLE" &&
    generationStage !== "COMPLETE" &&
    generationStage !== undefined;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread?.messages?.length, isStreaming]);

  if (!thread?.messages?.length) {
    return (
      <div className="flex flex-col h-full">
        <ThreadSidebar />
        <div className="flex items-center justify-center flex-1 text-slate-500">
          <div className="text-center">
            <div className="text-4xl mb-3">🤖</div>
            <p className="font-medium">AI Components</p>
            <p className="text-sm mt-1">Tambo will render components here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ThreadSidebar />

      <div ref={scrollRef} className="flex-1 space-y-4 p-4 overflow-y-auto">
        {thread.messages.map((message, index) => (
          <div
            key={message.id || index}
            className={`rounded-lg animate-slide-in ${
              message.role === "user"
                ? "bg-blue-900/30 border border-blue-800"
                : "bg-slate-700/50"
            }`}
          >
            {message.content?.[0]?.text && (
              <div className="px-4 py-3 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 uppercase tracking-wide">
                    {message.role}
                  </span>
                  {message.createdAt && (
                    <span className="text-[10px] text-slate-600 font-mono">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <p className="mt-1">{message.content[0].text}</p>
              </div>
            )}

            {message.renderedComponent && (
              <div className="border-t border-slate-600">
                {message.renderedComponent}
              </div>
            )}
          </div>
        ))}

        {isStreaming && <StreamingIndicator stage={generationStage!} />}
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="shrink-0 border-t border-white/5 bg-slate-900/50 p-3 animate-fade-in">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              Suggestions
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => accept({ suggestion, shouldSubmit: true })}
                className="px-3 py-1.5 text-xs text-slate-300 bg-slate-800/80 border border-slate-700/50 rounded-full hover:bg-blue-500/20 hover:border-blue-500/30 hover:text-blue-300 transition-all"
              >
                {suggestion.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
