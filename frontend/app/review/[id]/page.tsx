"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, ScrollText, Hash, Cpu, ShieldCheck } from "lucide-react";
import { getExtractionForReview, type ExtractionOut } from "@/lib/api";
import { ReviewForm } from "@/components/review-form";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ReviewPage({ params }: { params: { id: string } }) {
  const [extraction, setExtraction] = useState<ExtractionOut | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    getExtractionForReview(params.id)
      .then(setExtraction)
      .catch((e) => setErr((e as Error).message));
  }, [params.id]);

  if (err) return <div className="p-6 text-rose">Failed to load: {err}</div>;
  if (!extraction) return <div className="p-6 text-subtle text-sm">Loading…</div>;

  const signals = extraction.heuristic_signals;
  const passed = Object.values(signals).filter(Boolean).length;
  const total = Object.values(signals).length;

  return (
    <div className="px-6 py-6 max-w-[1280px] mx-auto space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="inline-flex items-center gap-1 text-2xs text-subtle hover:text-ink mb-2">
            <ArrowLeft className="h-3 w-3" /> Back to documents
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-ink flex items-center gap-2">
            <FileText className="h-5 w-5 text-ink-2" />
            {extraction.document_filename}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-2xs">
            <StatusBadge status={extraction.status} />
            <Badge variant="neutral"><Cpu className="h-2.5 w-2.5" /> {extraction.model}</Badge>
            <Badge variant="neutral"><Hash className="h-2.5 w-2.5" /> prompt {extraction.prompt_version}</Badge>
            <Badge variant={extraction.min_confidence >= 0.85 ? "success" : extraction.min_confidence >= 0.65 ? "warning" : "danger"} dot>
              min conf {extraction.min_confidence.toFixed(2)}
            </Badge>
            <Badge variant="info">mean {extraction.mean_confidence.toFixed(2)}</Badge>
          </div>
        </div>
        <div className="text-right border-l border-border pl-5">
          <div className="text-2xs uppercase tracking-wider text-subtle">Heuristic checks</div>
          <div className="text-2xl font-semibold tabular mt-1 text-ink">{passed}<span className="text-subtle">/{total}</span></div>
          <div className="text-2xs text-subtle">signals passed</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        <Card>
          <CardHeader
            title="Extracted fields"
            subtitle="Review and correct low-confidence values. Edits write to the audit log."
            action={<Badge variant={extraction.status === "auto_approved" ? "success" : "warning"} dot>{extraction.status === "auto_approved" ? "Auto-approved" : "Awaiting review"}</Badge>}
          />
          <CardBody>
            <ReviewForm extraction={extraction} />
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Heuristic signals" subtitle="Per-field gates for auto-approval" action={<ShieldCheck className="h-3.5 w-3.5 text-subtle" />} />
            <CardBody className="space-y-1">
              {Object.entries(signals).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 -mx-2 hover:bg-surface-2/50">
                  <span className="text-xs text-ink-2">{k.replace(/_/g, " ")}</span>
                  {v ? <Badge variant="success" dot>pass</Badge> : <Badge variant="danger" dot>fail</Badge>}
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="OCR text" subtitle="Source evidence before structuring" action={<ScrollText className="h-3.5 w-3.5 text-subtle" />} />
            <div className="px-5 pb-5">
              <pre className="text-2xs whitespace-pre-wrap rounded-md bg-surface-2/60 p-3 border border-border max-h-[420px] overflow-y-auto leading-relaxed text-ink-2 font-mono">
                {extraction.ocr_text ?? "(no OCR text)"}
              </pre>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
