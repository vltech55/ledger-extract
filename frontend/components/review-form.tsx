"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, Edit3, CornerDownRight } from "lucide-react";
import {
  submitCorrections,
  type ExtractionOut,
  type FieldExtract,
} from "@/lib/api";

const FIELDS = [
  { key: "vendor_name",    label: "Vendor name" },
  { key: "vendor_address", label: "Vendor address" },
  { key: "invoice_number", label: "Invoice #" },
  { key: "invoice_date",   label: "Invoice date" },
  { key: "due_date",       label: "Due date" },
  { key: "currency",       label: "Currency" },
  { key: "subtotal",       label: "Subtotal" },
  { key: "tax_amount",     label: "Tax" },
  { key: "total_amount",   label: "Total" },
] as const;

function isFieldExtract(v: unknown): v is FieldExtract {
  return typeof v === "object" && v !== null && "value" in v && "confidence" in v;
}

export function ReviewForm({ extraction }: { extraction: ExtractionOut }) {
  const initial = useMemo(() => {
    const out: Record<string, unknown> = {};
    for (const f of FIELDS) {
      const v = extraction.fields[f.key];
      out[f.key] = isFieldExtract(v) ? (v.value as unknown) : null;
    }
    return out;
  }, [extraction.fields]);

  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const [reviewer, setReviewer] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const diff = useMemo(() => {
    const out: Record<string, unknown> = {};
    for (const f of FIELDS) {
      if (String(values[f.key] ?? "") !== String(initial[f.key] ?? "")) out[f.key] = values[f.key];
    }
    return out;
  }, [values, initial]);

  async function submit() {
    if (!reviewer.trim()) { setErr("reviewer name required"); return; }
    setSubmitting(true); setErr(null);
    try {
      await submitCorrections(extraction.id, reviewer.trim(), diff);
      setSubmitted(true);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-md border border-accent/30 bg-accent-soft p-4">
        <div className="flex items-center gap-2 text-accent-hover">
          <Check className="h-4 w-4" />
          <span className="text-sm font-medium">Review submitted</span>
        </div>
        <div className="text-2xs text-muted mt-1">
          {Object.keys(diff).length} field correction{Object.keys(diff).length === 1 ? "" : "s"} written to the audit log.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {FIELDS.map(({ key, label }) => {
          const f = extraction.fields[key];
          const wrapped = isFieldExtract(f) ? f : null;
          const conf = wrapped?.adjusted_confidence ?? wrapped?.confidence ?? 0;
          const changed = String(values[key] ?? "") !== String(initial[key] ?? "");
          const tier = conf >= 0.85 ? "high" : conf >= 0.65 ? "med" : "low";
          const confColor = tier === "high" ? "text-accent-hover" : tier === "med" ? "text-warn" : "text-rose";
          return (
            <div key={key} className={`rounded-md border bg-surface p-3 transition-colors ${changed ? "border-violet/40 bg-violet-soft/40" : "border-border"}`}>
              <div className="flex items-center justify-between gap-2">
                <label className="text-2xs uppercase tracking-wider text-subtle flex items-center gap-1.5 font-medium">
                  {label}
                  {changed ? <Edit3 className="h-2.5 w-2.5 text-violet" /> : null}
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-16 conf-bar">
                    <div className={`conf-bar-fill ${tier}`} style={{ width: `${conf * 100}%` }} />
                  </div>
                  <span className={`font-mono text-2xs tabular ${confColor}`}>{conf.toFixed(2)}</span>
                </div>
              </div>
              <input
                value={String(values[key] ?? "")}
                onChange={(e) => setValues({ ...values, [key]: e.target.value || null })}
                className="mt-2 w-full rounded border border-border bg-surface px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 placeholder:text-subtle"
                placeholder="(no value)"
              />
              {wrapped?.evidence ? (
                <div className="mt-1.5 flex items-start gap-1.5 text-2xs text-subtle">
                  <CornerDownRight className="h-2.5 w-2.5 mt-0.5 shrink-0" />
                  <span className="italic line-clamp-2">{wrapped.evidence}</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <input
          value={reviewer}
          onChange={(e) => setReviewer(e.target.value)}
          placeholder="Reviewer name"
          className="rounded-md bg-surface border border-border px-3 py-1.5 text-sm focus:outline-none focus:border-accent placeholder:text-subtle"
        />
        <button
          onClick={submit}
          disabled={submitting || Object.keys(diff).length === 0}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-40 shadow-sm"
        >
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Approve {Object.keys(diff).length} correction{Object.keys(diff).length === 1 ? "" : "s"}
        </button>
      </div>
      {err ? <div className="rounded-md border border-rose/30 bg-rose-soft px-3 py-2 text-sm text-rose">{err}</div> : null}
    </div>
  );
}
