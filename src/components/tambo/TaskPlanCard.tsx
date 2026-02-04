"use client";

import { TaskPlanCard as TaskPlanCardType } from "@/lib/schemas";
import { Card, Badge, Progress, cn } from "@/components/ui/primitives";
import { Clock, Check } from "lucide-react";

const statusStyles = {
  todo: { dot: "bg-slate-600", text: "text-slate-500" },
  doing: { dot: "bg-blue-500 animate-pulse", text: "text-slate-200" },
  done: { dot: "bg-emerald-500", text: "text-slate-500" },
  blocked: { dot: "bg-red-500", text: "text-red-400" },
};

export interface TaskPlanCardProps {
  data: TaskPlanCardType;
}

export default function TaskPlanCard({ data }: TaskPlanCardProps) {
  const completedCount = data.steps.filter((s) => s.status === "done").length;
  const progress = Math.round((completedCount / data.steps.length) * 100);

  return (
    <Card className="p-4 w-full animate-fade-in">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" /> {data.title}
        </h3>
        <span className="text-xs font-mono text-blue-300">{progress}% Complete</span>
      </div>
      <Progress value={progress} className="mb-6 h-1" />
      <div className="space-y-4 pl-2">
        {data.steps.map((step, idx) => {
          const status = statusStyles[step.status];
          const isLast = idx === data.steps.length - 1;

          return (
            <div
              key={step.id}
              className={cn(
                "relative pl-6 pb-1",
                !isLast && "border-l border-slate-700"
              )}
            >
              <div
                className={cn(
                  "absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900",
                  status.dot
                )}
              />
              <div className="flex justify-between items-start -mt-1">
                <div>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      step.status === "todo" ? "text-slate-500" : "text-slate-200"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.notes && (
                    <p className="text-xs text-slate-500 mt-0.5">{step.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {step.owner}
                  </Badge>
                  {step.status === "done" && (
                    <Check className="w-3 h-3 text-emerald-500" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-slate-500">Assigned Agents</span>
        <div className="flex -space-x-2">
          {["OR", "RE", "BU", "AU"].slice(0, 3).map((i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-400"
            >
              {i}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
