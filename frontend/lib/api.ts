export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export type DocumentOut = {
  id: string;
  filename: string;
  status: "pending" | "processing" | "extracted" | "failed";
  failure_reason: string | null;
  page_count: number | null;
  byte_size: number;
  uploaded_at: string;
  extraction_id: string | null;
  extraction_status: string | null;
  min_confidence: number | null;
};

export type FieldExtract = {
  value: unknown;
  confidence: number;
  evidence: string | null;
  adjusted_confidence?: number;
  reviewer_corrected?: boolean;
};

export type ExtractionOut = {
  id: string;
  document_id: string;
  document_filename: string;
  prompt_version: string;
  model: string;
  fields: Record<string, unknown>;
  min_confidence: number;
  mean_confidence: number;
  heuristic_signals: Record<string, boolean>;
  status: string;
  created_at: string;
  ocr_text: string | null;
};

export async function listDocuments(): Promise<DocumentOut[]> {
  const r = await fetch(`${API_BASE}/documents`, { cache: "no-store" });
  if (!r.ok) throw new Error(`documents ${r.status}`);
  return r.json();
}

export async function getExtractionForReview(id: string): Promise<ExtractionOut> {
  const r = await fetch(`${API_BASE}/review/${id}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`extraction ${r.status}`);
  return r.json();
}

export async function reviewQueue(): Promise<ExtractionOut[]> {
  const r = await fetch(`${API_BASE}/review/queue`, { cache: "no-store" });
  if (!r.ok) throw new Error(`queue ${r.status}`);
  return r.json();
}

export async function uploadPdf(file: File): Promise<DocumentOut> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch(`${API_BASE}/documents`, { method: "POST", body: fd });
  if (!r.ok) {
    const detail = await r.text();
    throw new Error(`upload failed: ${r.status} ${detail}`);
  }
  return r.json();
}

export async function submitCorrections(
  extractionId: string,
  reviewer: string,
  corrections: Record<string, unknown>,
): Promise<unknown> {
  const r = await fetch(`${API_BASE}/review/${extractionId}/correct`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reviewer, corrections }),
  });
  if (!r.ok) throw new Error(`correct ${r.status}`);
  return r.json();
}
