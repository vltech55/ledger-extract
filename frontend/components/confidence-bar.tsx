"use client";

export function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const cls = value >= 0.85 ? "high" : value >= 0.6 ? "med" : "low";
  return (
    <div className="conf-bar w-24" title={`${value.toFixed(2)}`}>
      <div className={`conf-bar-fill ${cls}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
