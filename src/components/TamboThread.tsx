"use client";

import { useTambo } from "@tambo-ai/react";

export default function TamboThread() {
  const { thread } = useTambo();

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
    <div className="space-y-4 p-4 overflow-y-auto">
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
  );
}
