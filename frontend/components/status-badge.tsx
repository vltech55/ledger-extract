"use client";

const COLORS: Record<string, string> = {
  pending: "bg-neutral-700 text-neutral-200",
  processing: "bg-sky-700/40 text-sky-200",
  extracted: "bg-green-700/30 text-green-200",
  failed: "bg-red-700/40 text-red-200",
  auto_approved: "bg-green-700/30 text-green-200",
  needs_review: "bg-amber-700/40 text-amber-200",
  reviewed_corrected: "bg-violet-700/40 text-violet-200",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = COLORS[status] ?? "bg-neutral-700 text-neutral-200";
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
