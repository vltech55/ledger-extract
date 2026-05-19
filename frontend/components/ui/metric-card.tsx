import { clsx } from "clsx";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import type { ReactNode } from "react";
import { Sparkline } from "./sparkline";

export function MetricCard({
  label, value, unit, delta, trend, icon, spark, sparkColor = "#0a8b6a",
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;
  trend?: "up" | "down" | "flat";
  icon?: ReactNode;
  spark?: number[];
  sparkColor?: string;
}) {
  const dir = trend ?? (delta == null ? "flat" : delta > 0 ? "up" : delta < 0 ? "down" : "flat");
  const deltaColor = dir === "up" ? "text-accent-hover" : dir === "down" ? "text-rose" : "text-subtle";
  const DeltaIcon = dir === "up" ? ArrowUpRight : dir === "down" ? ArrowDownRight : Minus;

  return (
    <div className="rounded-lg border border-border bg-surface px-5 py-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-2xs uppercase tracking-wider text-subtle">
          {icon ? <span className="text-muted">{icon}</span> : null}
          <span>{label}</span>
        </div>
        {delta != null ? (
          <span className={clsx("inline-flex items-center gap-0.5 text-2xs font-medium tabular", deltaColor)}>
            <DeltaIcon className="h-3 w-3" />
            {Math.abs(delta).toFixed(1)}%
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-semibold tabular text-ink">{value}</span>
        {unit ? <span className="text-xs text-subtle">{unit}</span> : null}
      </div>
      {spark && spark.length > 1 ? (
        <div className="mt-2 -mx-1">
          <Sparkline data={spark} color={sparkColor} height={32} />
        </div>
      ) : null}
    </div>
  );
}
