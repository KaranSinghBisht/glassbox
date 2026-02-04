"use client";

import { DiffBeforeAction as DiffBeforeActionType } from "@/lib/schemas";
import { Card, Button, cn } from "@/components/ui/primitives";

const riskStyles = {
  low: { border: "border-emerald-500/30" },
  medium: { border: "border-amber-500/30" },
  high: { border: "border-orange-500/30" },
  critical: { border: "border-red-500/30" },
};

export interface DiffBeforeActionProps {
  data: DiffBeforeActionType;
  onProceed?: (actionId: string) => void;
  onCancel?: (actionId: string) => void;
}

export default function DiffBeforeAction({
  data,
  onProceed,
  onCancel,
}: DiffBeforeActionProps) {
  const risk = riskStyles[data.risk];

  const lines = data.diff.split("\n");
  const additions = lines.filter(
    (l) => l.startsWith("+") && !l.startsWith("+++")
  ).length;
  const deletions = lines.filter(
    (l) => l.startsWith("-") && !l.startsWith("---")
  ).length;

  return (
    <Card className={cn("overflow-hidden animate-fade-in", risk.border)}>
      <div className="bg-slate-900 p-2 px-4 border-b border-white/5 flex justify-between text-xs font-mono text-slate-400">
        <span>{data.filePath || data.title}</span>
        <span className="flex gap-2">
          <span className="text-emerald-500">+{data.linesAdded ?? additions}</span>
          <span className="text-red-500">-{data.linesRemoved ?? deletions}</span>
        </span>
      </div>
      <div className="font-mono text-xs overflow-x-auto">
        {lines.map((line, i) => {
          let lineNum = i + 1;
          const isAddition = line.startsWith("+") && !line.startsWith("+++");
          const isDeletion = line.startsWith("-") && !line.startsWith("---");
          const isHunk = line.startsWith("@@");

          return (
            <div
              key={i}
              className={cn(
                "flex py-0.5 px-4",
                isAddition && "bg-emerald-500/10 text-emerald-300",
                isDeletion && "bg-red-500/10 text-red-300",
                isHunk && "bg-blue-500/10 text-blue-400",
                !isAddition && !isDeletion && !isHunk && "text-slate-500"
              )}
            >
              <span className="w-8 opacity-50 select-none text-right pr-2">
                {lineNum}
              </span>
              <span className="whitespace-pre">{line}</span>
            </div>
          );
        })}
      </div>
      <div className="p-4 flex gap-3 justify-end bg-slate-900/50 border-t border-white/5">
        <Button variant="ghost" onClick={() => onCancel?.(data.actionId)}>
          Cancel
        </Button>
        <Button onClick={() => onProceed?.(data.actionId)}>Apply Changes</Button>
      </div>
    </Card>
  );
}
