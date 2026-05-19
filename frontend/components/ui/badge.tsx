import { clsx } from "clsx";
import type { ReactNode } from "react";

type Variant = "default" | "success" | "info" | "warning" | "danger" | "violet" | "neutral";

const styles: Record<Variant, string> = {
  default: "bg-surface-2 text-ink-2 ring-1 ring-inset ring-border",
  neutral: "bg-surface-2 text-ink-2 ring-1 ring-inset ring-border",
  success: "bg-accent-soft text-accent-hover ring-1 ring-inset ring-accent/20",
  info: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/60",
  warning: "bg-warn-soft text-warn ring-1 ring-inset ring-warn/30",
  danger: "bg-rose-soft text-rose ring-1 ring-inset ring-rose/30",
  violet: "bg-violet-soft text-violet ring-1 ring-inset ring-violet/30",
};

export function Badge({
  variant = "default",
  children,
  dot = false,
  className,
}: {
  variant?: Variant;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span className={clsx(
      "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-2xs font-medium",
      styles[variant],
      className,
    )}>
      {dot ? <span className={clsx("h-1.5 w-1.5 rounded-full", dotColor(variant))} /> : null}
      {children}
    </span>
  );
}

function dotColor(v: Variant): string {
  switch (v) {
    case "success": return "bg-accent";
    case "info": return "bg-blue-500";
    case "warning": return "bg-warn";
    case "danger": return "bg-rose";
    case "violet": return "bg-violet";
    default: return "bg-subtle";
  }
}
