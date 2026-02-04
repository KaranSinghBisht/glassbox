import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
    size?: "sm" | "md" | "lg";
  }
>(({ className, variant = "primary", size = "md", ...props }, ref) => {
  const variants = {
    primary:
      "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/20 border border-blue-500/50",
    secondary:
      "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700",
    ghost: "hover:bg-slate-800/50 text-slate-400 hover:text-slate-100",
    destructive:
      "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50",
    outline:
      "bg-transparent border border-slate-700 hover:border-slate-500 text-slate-300",
  };
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});
Button.displayName = "Button";

export const Badge = ({
  children,
  variant = "default",
  className,
}: {
  children?: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "outline";
  className?: string;
}) => {
  const variants = {
    default: "bg-slate-800 text-slate-300 border-slate-700",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-red-500/10 text-red-400 border-red-500/20",
    outline: "bg-transparent border-slate-700 text-slate-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

export const Card = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("glass-card rounded-xl overflow-hidden", className)}>
    {children}
  </div>
);

export const Tabs = ({
  options,
  active,
  onChange,
}: {
  options: string[];
  active: string;
  onChange: (val: string) => void;
}) => (
  <div className="flex p-1 bg-slate-900/50 rounded-lg border border-white/5 w-fit">
    {options.map((opt) => (
      <button
        key={opt}
        onClick={() => onChange(opt)}
        className={cn(
          "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
          active === opt
            ? "bg-slate-700 text-white shadow-sm"
            : "text-slate-500 hover:text-slate-300"
        )}
      >
        {opt}
      </button>
    ))}
  </div>
);

export const Progress = ({
  value,
  className,
  colorClass = "bg-blue-500",
}: {
  value: number;
  className?: string;
  colorClass?: string;
}) => (
  <div
    className={cn(
      "h-1.5 w-full bg-slate-800 rounded-full overflow-hidden",
      className
    )}
  >
    <div
      className={cn("h-full transition-all duration-500 ease-out", colorClass)}
      style={{ width: `${value}%` }}
    />
  </div>
);
