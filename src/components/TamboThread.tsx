"use client";

import { useTambo, useTamboSuggestions } from "@tambo-ai/react";
import { Zap } from "lucide-react";

export default function TamboThread() {
  const { thread } = useTambo();
  const { suggestions, accept } = useTamboSuggestions({ maxSuggestions: 3 });

  if (!thread?.messages?.length) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <div className="text-4xl mb-3">🤖</div>
          <p className="font-medium">AI Components</p>
          <p className="text-sm mt-1">Tambo will render components here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4 p-4 overflow-y-auto">
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
                <span className="text-xs text-slate-500 uppercase tracking-wide">
                  {message.role}
                </span>
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
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="shrink-0 border-t border-white/5 bg-slate-900/50 p-3 animate-fade-in">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Suggestions</span>
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
