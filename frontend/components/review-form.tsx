"use client";

import { useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import {
  submitCorrections,
  type ExtractionOut,
  type FieldExtract,
} from "@/lib/api";
import { ConfidenceBar } from "./confidence-bar";

const FIELDS = [
  "vendor_name", "vendor_address", "invoice_number",
  "invoice_date", "due_date", "currency",
  "subtotal", "tax_amount", "total_amount",
] as const;

function isFieldExtract(v: unknown): v is FieldExtract {
  return typeof v === "object" && v !== null && "value" in v && "confidence" in v;
}

export function ReviewForm({ extraction }: { extraction: ExtractionOut }) {
  const initial = useMemo(() => {
    const out: Record<string, unknown> = {};
    for (const k of FIELDS) {
      const f = extraction.fields[k];
      out[k] = isFieldExtract(f) ? (f.value as unknown) : null;
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
    for (const k of FIELDS) {
      if (String(values[k] ?? "") !== String(initial[k] ?? "")) out[k] = values[k];
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
      <div className="p-4 rounded border border-green-700/40 bg-green-700/10 text-green-200 text-sm">
        Submitted. {Object.keys(diff).length} field(s) corrected.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {FIELDS.map((k) => {
          const f = extraction.fields[k];
          const wrapped = isFieldExtract(f) ? f : null;
          const conf = wrapped?.adjusted_confidence ?? wrapped?.confidence ?? 0;
          return (
            <div key={k} className="border border-neutral-800 rounded p-3">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>{k}</span>
                <div className="flex items-center gap-2">
                  <ConfidenceBar value={conf} />
                  <span className="font-mono">{conf.toFixed(2)}</span>
                </div>
              </div>
              <input
                value={String(values[k] ?? "")}
                onChange={(e) => setValues({ ...values, [k]: e.target.value || null })}
                className="mt-2 w-full rounded bg-neutral-900 border border-neutral-700 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder={`(no value)`}
              />
              {wrapped?.evidence ? (
                <div className="mt-1 text-xs text-neutral-500 italic line-clamp-2">
                  evidence: {wrapped.evidence}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={reviewer}
          onChange={(e) => setReviewer(e.target.value)}
          placeholder="Reviewer name"
          className="rounded bg-neutral-900 border border-neutral-700 px-2 py-1 text-sm"
        />
        <button
          onClick={submit}
          disabled={submitting || Object.keys(diff).length === 0}
          className="inline-flex items-center gap-1 rounded bg-sky-500 px-3 py-1 text-sm font-medium text-neutral-950 hover:bg-sky-400 disabled:opacity-40"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Submit {Object.keys(diff).length} correction{Object.keys(diff).length === 1 ? "" : "s"}
        </button>
      </div>
      {err ? <div className="text-red-300 text-sm">{err}</div> : null}
    </div>
  );
}
