"use client";

import { TaskPlanCard as TaskPlanCardType } from "@/lib/schemas";

const statusStyles = {
  todo: { bg: "bg-slate-100", text: "text-slate-600", icon: "○" },
  doing: { bg: "bg-blue-100", text: "text-blue-600", icon: "◐" },
  done: { bg: "bg-green-100", text: "text-green-600", icon: "●" },
  blocked: { bg: "bg-red-100", text: "text-red-600", icon: "✕" },
};

const roleColors = {
  orchestrator: "border-l-purple-500",
  researcher: "border-l-blue-500",
  builder: "border-l-amber-500",
  auditor: "border-l-emerald-500",
};

export interface TaskPlanCardProps {
  data: TaskPlanCardType;
}

export default function TaskPlanCard({ data }: TaskPlanCardProps) {
  const completedCount = data.steps.filter((s) => s.status === "done").length;
  const progress = (completedCount / data.steps.length) * 100;

  return (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <h3 className="font-semibold text-slate-800">{data.title}</h3>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-slate-500">
            {completedCount}/{data.steps.length}
          </span>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {data.steps.map((step) => {
          const status = statusStyles[step.status];
          const roleColor = roleColors[step.owner] || "border-l-slate-300";

          return (
            <div
              key={step.id}
              className={`px-4 py-3 border-l-4 ${roleColor} ${status.bg}`}
            >
              <div className="flex items-start gap-3">
                <span className={`text-lg ${status.text}`}>{status.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-slate-800">
                      {step.label}
                    </span>
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                      {step.owner}
                    </span>
                  </div>
                  {step.notes && (
                    <p className="mt-1 text-xs text-slate-500">{step.notes}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
