"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Inbox,
  FileText,
  Clock,
  ArrowUpRight,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import { reviewQueue, type ExtractionOut } from "@/lib/api";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function QueuePage() {
  const [queue, setQueue] = useState<ExtractionOut[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reviewQueue()
      .then((q) => setQueue([...q].sort((a, b) => a.min_confidence - b.min_confidence)))
      .catch((e) => setErr((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (err) return <div className="p-6 text-rose">{err}</div>;

  const lowest = queue.length > 0 ? queue[0].min_confidence : 0;
  const avg = queue.length === 0 ? 0 : queue.reduce((s, q) => s + q.min_confidence, 0) / queue.length;

  return (
    <div className="px-6 py-6 max-w-[1280px] mx-auto space-y-6 animate-slide-up">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-2xs uppercase tracking-wider text-subtle">May 2026 ledger period · queue</div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink mt-0.5">Review queue</h1>
          <p className="text-sm text-muted mt-1">
            Extractions with at least one field below the auto-approve threshold. Sorted by lowest confidence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-border bg-surface px-3 py-1.5">
            <div className="text-2xs text-subtle">Queue size</div>
            <div className="text-lg font-semibold tabular leading-tight">{queue.length}</div>
          </div>
          <div className="rounded-md border border-border bg-surface px-3 py-1.5">
            <div className="text-2xs text-subtle">Lowest min conf</div>
            <div className="text-lg font-semibold tabular leading-tight text-rose">{lowest.toFixed(2)}</div>
          </div>
          <div className="rounded-md border border-border bg-surface px-3 py-1.5">
            <div className="text-2xs text-subtle">Avg min conf</div>
            <div className="text-lg font-semibold tabular leading-tight text-warn">{avg.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <Card>
        <div className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-2xs uppercase tracking-wider text-subtle bg-surface-2/60">
                <th className="px-5 py-2.5 font-medium">Invoice</th>
                <th className="px-2 py-2.5 font-medium">Vendor</th>
                <th className="px-2 py-2.5 font-medium">Status</th>
                <th className="px-2 py-2.5 font-medium">Min conf</th>
                <th className="px-2 py-2.5 font-medium">Mean conf</th>
                <th className="px-2 py-2.5 font-medium">Submitted</th>
                <th className="px-5 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-subtle">Loading…</td></tr>
              ) : queue.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center">
                  <Inbox className="h-8 w-8 text-border-strong mx-auto mb-2" />
                  <div className="text-sm text-subtle">Nothing to review.</div>
                </td></tr>
              ) : queue.map((e) => {
                const tier = e.min_confidence >= 0.85 ? "high" : e.min_confidence >= 0.65 ? "med" : "low";
                const vendor = (e.fields as Record<string, { value?: string }>).vendor_name?.value ?? "—";
                return (
                  <tr key={e.id} className="border-t border-border hover:bg-surface-2/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-2 text-ink-2 border border-border">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-ink font-medium">{e.document_filename}</div>
                          <div className="text-2xs text-subtle font-mono tabular">{e.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-ink-2">{vendor}</td>
                    <td className="px-2 py-3"><StatusBadge status={e.status} /></td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2 max-w-[140px]">
                        <span className={`font-mono text-xs tabular ${tier === "low" ? "text-rose" : tier === "med" ? "text-warn" : "text-accent"}`}>{e.min_confidence.toFixed(2)}</span>
                        <div className="flex-1 conf-bar">
                          <div className={`conf-bar-fill ${tier}`} style={{ width: `${e.min_confidence * 100}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 font-mono text-xs tabular text-muted">{e.mean_confidence.toFixed(2)}</td>
                    <td className="px-2 py-3 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(e.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/review/${e.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover">
                        Review <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
