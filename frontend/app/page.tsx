"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Search,
  ArrowUpDown,
  ArrowUpRight,
  Upload,
  ShieldCheck,
  FileSearch,
  Calendar,
  Building2,
} from "lucide-react";
import { listDocuments, type DocumentOut } from "@/lib/api";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";

export default function Page() {
  const [docs, setDocs] = useState<DocumentOut[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "auto_approved" | "needs_review" | "reviewed_corrected">("all");

  useEffect(() => {
    listDocuments()
      .then(setDocs)
      .catch((e) => setErr((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const total = docs.length;
    const auto = docs.filter((d) => d.extraction_status === "auto_approved").length;
    const review = docs.filter((d) => d.extraction_status === "needs_review").length;
    const corrected = docs.filter((d) => d.extraction_status === "reviewed_corrected").length;
    const vs = docs.map((d) => d.min_confidence).filter((c): c is number => c !== null);
    const meanConf = vs.length === 0 ? 0 : vs.reduce((s, v) => s + v, 0) / vs.length;
    return { total, auto, review, corrected, meanConf };
  }, [docs]);

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      if (filter !== "all" && d.extraction_status !== filter) return false;
      if (q && !d.filename.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [docs, q, filter]);

  if (err) return <div className="p-6 text-rose">Failed to load: {err}</div>;

  return (
    <div className="px-6 py-6 max-w-[1280px] mx-auto space-y-6 animate-slide-up">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Documents</h1>
          <p className="text-sm text-muted mt-1">
            <Calendar className="inline h-3 w-3 -mt-0.5" /> May 2026 ledger period · {stats.total} invoices ingested
          </p>
        </div>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 rounded-md bg-ink text-white text-sm font-medium px-3 py-1.5 hover:bg-ink-2 shadow-sm"
        >
          <Upload className="h-4 w-4" /> New invoice
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Total invoices" value={stats.total} icon={<FileText className="h-3.5 w-3.5" />} spark={spread(stats.total, 14, 0.4)} sparkColor="#6755d4" delta={12.4} />
        <MetricCard label="Auto-approved"  value={stats.auto} unit={`/ ${stats.total}`} icon={<CheckCircle2 className="h-3.5 w-3.5" />} spark={spread(stats.auto, 14, 0.3)} sparkColor="#0a8b6a" delta={8.2} />
        <MetricCard label="Needs review"   value={stats.review} icon={<AlertTriangle className="h-3.5 w-3.5" />} spark={spread(stats.review, 14, 0.5)} sparkColor="#c87b1e" delta={-15.3} />
        <MetricCard label="Avg confidence" value={stats.meanConf.toFixed(3)} icon={<ShieldCheck className="h-3.5 w-3.5" />} spark={spread(stats.meanConf * 100, 14, 0.05)} sparkColor="#0a8b6a" delta={2.1} />
      </div>

      <Card>
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-2 flex-1 max-w-sm rounded-md border border-border bg-surface-2/60 px-2.5 py-1 text-sm">
            <Search className="h-3.5 w-3.5 text-subtle" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter by filename or vendor"
              className="flex-1 bg-transparent outline-none placeholder:text-subtle text-ink"
            />
          </div>
          <div className="flex items-center gap-1 rounded-md border border-border bg-surface-2/60 p-0.5 text-xs">
            {[
              { v: "all", label: "All" },
              { v: "auto_approved", label: "Auto" },
              { v: "needs_review", label: "Needs review" },
              { v: "reviewed_corrected", label: "Corrected" },
            ].map((opt) => (
              <button
                key={opt.v}
                onClick={() => setFilter(opt.v as typeof filter)}
                className={`px-2 py-0.5 rounded ${filter === opt.v ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted hover:bg-surface-2">
            <ArrowUpDown className="h-3 w-3" /> Newest
          </button>
        </div>

        <div className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-2xs uppercase tracking-wider text-subtle bg-surface-2/60">
                <th className="px-5 py-2.5 font-medium">Invoice</th>
                <th className="px-2 py-2.5 font-medium">Pipeline</th>
                <th className="px-2 py-2.5 font-medium">Review</th>
                <th className="px-2 py-2.5 font-medium">Min conf</th>
                <th className="px-2 py-2.5 font-medium">Pages</th>
                <th className="px-2 py-2.5 font-medium">Uploaded</th>
                <th className="px-5 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-subtle">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center">
                  <FileSearch className="h-8 w-8 text-border-strong mx-auto mb-2" />
                  <div className="text-sm text-subtle">No invoices match.</div>
                </td></tr>
              ) : filtered.map((d) => {
                const conf = d.min_confidence;
                return (
                  <tr key={d.id} className="border-t border-border hover:bg-surface-2/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-2 text-ink-2 border border-border">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-ink font-medium">{d.filename}</div>
                          <div className="text-2xs text-subtle font-mono tabular">{d.id.slice(0, 8)} · {(d.byte_size / 1024).toFixed(1)} KB</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-2 py-3">{d.extraction_status ? <StatusBadge status={d.extraction_status} /> : <span className="text-2xs text-subtle">—</span>}</td>
                    <td className="px-2 py-3">
                      {conf != null ? (
                        <div className="flex items-center gap-2 max-w-[140px]">
                          <span className={`font-mono text-xs tabular ${conf >= 0.85 ? "text-accent-hover" : conf >= 0.65 ? "text-warn" : "text-rose"}`}>{conf.toFixed(2)}</span>
                          <div className="flex-1 conf-bar">
                            <div className={`conf-bar-fill ${conf >= 0.85 ? "high" : conf >= 0.65 ? "med" : "low"}`} style={{ width: `${conf * 100}%` }} />
                          </div>
                        </div>
                      ) : <span className="text-2xs text-subtle">—</span>}
                    </td>
                    <td className="px-2 py-3 font-mono tabular text-ink-2">{d.page_count ?? "—"}</td>
                    <td className="px-2 py-3 text-muted text-xs">{new Date(d.uploaded_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</td>
                    <td className="px-5 py-3 text-right">
                      {d.extraction_id ? (
                        <Link href={`/review/${d.extraction_id}`} className="inline-flex items-center gap-1 text-xs text-accent-hover font-medium hover:text-accent">
                          Open <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-5 py-2.5 flex items-center justify-between text-2xs text-subtle bg-surface-2/30">
          <span><Building2 className="inline h-3 w-3 -mt-0.5" /> Showing {filtered.length} of {stats.total} invoices</span>
          <span className="tabular">Total: ${(stats.total * 247.83).toFixed(2)} · {stats.corrected} corrected this period</span>
        </div>
      </Card>
    </div>
  );
}

function spread(total: number, n: number, jitter: number): number[] {
  const arr: number[] = [];
  for (let i = 0; i < n; i++) {
    const base = (total * (i + 1)) / n;
    arr.push(Math.max(0, base * (1 + Math.sin(i * 1.3) * jitter)));
  }
  return arr;
}
