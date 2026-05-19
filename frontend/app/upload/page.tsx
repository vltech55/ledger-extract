"use client";

import { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";
import { uploadPdf } from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Item = {
  name: string;
  size: number;
  status: "queued" | "uploading" | "done" | "error";
  progress: number;
  doc_id?: string;
};

const RECENT_BATCHES = [
  { id: "batch_91afc2",  source: "drag-drop · 12 files",     when: "2h ago",  ok: 12,  fail: 0, mean_conf: 0.94 },
  { id: "batch_45b7a1",  source: "s3://acme-ap-inbox · cron", when: "1d ago",  ok: 187, fail: 3, mean_conf: 0.91 },
  { id: "batch_28e93f",  source: "email-in · ap@acme.example", when: "1d ago",  ok: 24,  fail: 1, mean_conf: 0.88 },
  { id: "batch_d12c98",  source: "drag-drop · 4 files",      when: "2d ago",  ok: 4,   fail: 0, mean_conf: 0.96 },
  { id: "batch_77ee01",  source: "s3://acme-ap-inbox · cron", when: "2d ago",  ok: 154, fail: 2, mean_conf: 0.92 },
];

export default function UploadPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const next: Item[] = Array.from(files).map((f) => ({
      name: f.name, size: f.size, status: "queued", progress: 0,
    }));
    setItems((prev) => [...next, ...prev]);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, status: "uploading", progress: 30 } : it));
      try {
        const r = await uploadPdf(file);
        setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, status: "done", progress: 100, doc_id: r.id } : it));
      } catch {
        setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, status: "error" } : it));
      }
    }
  }

  return (
    <div className="px-6 py-6 max-w-[1280px] mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Upload</h1>
        <p className="text-sm text-muted mt-1 max-w-2xl">
          Drop PDFs, JPEGs, or scanned TIFFs. We run OCR, then schema-enforced extraction.
          High-confidence rows auto-approve into the ledger; the rest queue for review.
        </p>
      </div>

      <div
        className={`relative rounded-xl border-2 border-dashed transition-colors ${dragOver ? "border-accent bg-accent-soft" : "border-border-strong bg-surface"}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      >
        <div className="py-14 px-6 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-xl bg-accent-soft text-accent flex items-center justify-center mb-4">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div className="text-lg font-semibold text-ink">Drop invoices here</div>
          <p className="text-sm text-muted mt-1 max-w-md">
            or <button onClick={() => fileRef.current?.click()} className="text-accent hover:text-accent-hover font-medium">browse</button> from your computer · up to 20 files at a time · max 25 MB each
          </p>
          <input ref={fileRef} type="file" multiple accept="application/pdf,image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          <div className="mt-5 flex items-center gap-4 text-xs text-subtle flex-wrap justify-center">
            <span><span className="font-mono">PDF</span> · scanned or digital</span>
            <span>·</span>
            <span><span className="font-mono">JPG</span> · single page</span>
            <span>·</span>
            <span><span className="font-mono">TIFF</span> · multi-page</span>
            <span>·</span>
            <span>up to <span className="font-mono">25 MB</span> · throughput <span className="font-mono">~4 / sec</span></span>
          </div>
        </div>
      </div>

      {items.length > 0 ? (
        <Card>
          <CardHeader title="Current batch" subtitle={`${items.length} file${items.length === 1 ? "" : "s"}`} />
          <div>
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-[36px_1fr_180px_140px_30px] gap-3 items-center px-5 py-3 border-t border-border">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-2 text-ink-2 border border-border">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-ink font-medium">{it.name}</div>
                  <div className="text-2xs text-subtle font-mono tabular">{(it.size / 1024).toFixed(1)} KB</div>
                </div>
                <div>
                  <div className="conf-bar"><div className="conf-bar-fill high" style={{ width: `${it.progress}%` }} /></div>
                  <div className="text-2xs text-subtle font-mono mt-1">{it.progress}%</div>
                </div>
                <div>
                  {it.status === "done" ? <Badge variant="success" dot><CheckCircle2 className="h-2.5 w-2.5" /> Extracted</Badge>
                   : it.status === "uploading" ? <Badge variant="info" dot><Loader2 className="h-2.5 w-2.5 animate-spin" /> Processing</Badge>
                   : it.status === "error" ? <Badge variant="danger" dot><AlertTriangle className="h-2.5 w-2.5" /> Failed</Badge>
                   : <Badge variant="neutral">Queued</Badge>}
                </div>
                <button className="text-subtle hover:text-rose"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Extraction pipeline" subtitle="Same pipeline runs against every uploaded document" />
          <div className="p-5">
            <ol className="grid grid-cols-4 gap-1.5">
              {[
                { n: 1, t: "Upload", d: "PDF / image ingested, hashed, deduped against prior batches." },
                { n: 2, t: "OCR",    d: "Tesseract for scans · pdfminer for native PDFs · positions preserved." },
                { n: 3, t: "Extract", d: "Claude function-call w/ frozen v1.4.2 prompt + 9-field schema." },
                { n: 4, t: "Gate",   d: "Per-field confidence × heuristics → auto-approve or queue for review." },
              ].map((s) => (
                <li key={s.n} className="rounded-lg border border-border bg-surface-2/40 p-3.5">
                  <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-2xs font-semibold bg-accent-soft text-accent">step {s.n}</div>
                  <div className="text-sm font-semibold mt-2 text-ink">{s.t}</div>
                  <div className="text-2xs text-muted mt-1 leading-relaxed">{s.d}</div>
                </li>
              ))}
            </ol>
          </div>
        </Card>

        <Card>
          <CardHeader title="Auto-import" subtitle="Continuous sources" />
          <div className="p-5 space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-md bg-warn-soft text-warn flex items-center justify-center font-mono font-bold text-xs">S3</div>
              <div className="flex-1">
                <div className="font-medium text-ink">s3://acme-ap-inbox/</div>
                <div className="text-2xs text-muted">cron · every 15m · <span className="font-mono">218 KB/day</span></div>
              </div>
              <Badge variant="success" dot>active</Badge>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-md bg-violet-soft text-violet flex items-center justify-center font-mono font-bold text-xs">M</div>
              <div className="flex-1">
                <div className="font-medium text-ink">ap@acme.example</div>
                <div className="text-2xs text-muted">email-in · 24/7 · <span className="font-mono">~6/day</span></div>
              </div>
              <Badge variant="success" dot>active</Badge>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-md bg-rose-soft text-rose flex items-center justify-center font-mono font-bold text-xs">W</div>
              <div className="flex-1">
                <div className="font-medium text-ink">/api/v1/documents POST</div>
                <div className="text-2xs text-muted">webhook · NetSuite + Concur · idempotent</div>
              </div>
              <Badge variant="success" dot>active</Badge>
            </div>
            <button className="w-full mt-2 text-xs text-accent hover:text-accent-hover font-medium py-2 border border-dashed border-border rounded-md">+ Add source</button>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Recent batches" subtitle="Last 30 days · click for full audit" />
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-2xs uppercase tracking-wider text-subtle bg-surface-2/60">
              <th className="px-5 py-2.5 font-medium">Batch</th>
              <th className="px-2 py-2.5 font-medium">Source</th>
              <th className="px-2 py-2.5 font-medium">Extracted</th>
              <th className="px-2 py-2.5 font-medium">Failed</th>
              <th className="px-2 py-2.5 font-medium">Mean conf.</th>
              <th className="px-5 py-2.5 font-medium">Started</th>
            </tr>
          </thead>
          <tbody>
            {RECENT_BATCHES.map((b) => (
              <tr key={b.id} className="border-t border-border hover:bg-surface-2/50">
                <td className="px-5 py-3 font-mono text-xs text-ink-2">{b.id}</td>
                <td className="px-2 py-3 text-ink-2">{b.source}</td>
                <td className="px-2 py-3 font-mono tabular"><span className="text-accent">{b.ok}</span></td>
                <td className="px-2 py-3 font-mono tabular">{b.fail > 0 ? <span className="text-rose">{b.fail}</span> : <span className="text-subtle">0</span>}</td>
                <td className="px-2 py-3">
                  <div className="flex items-center gap-2 max-w-[140px]">
                    <span className="font-mono text-xs tabular text-accent">{b.mean_conf.toFixed(2)}</span>
                    <div className="flex-1 conf-bar"><div className="conf-bar-fill high" style={{ width: `${b.mean_conf * 100}%` }} /></div>
                  </div>
                </td>
                <td className="px-5 py-3 text-xs text-muted">{b.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
