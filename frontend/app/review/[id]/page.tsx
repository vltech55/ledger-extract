import { getExtractionForReview } from "@/lib/api";
import { ReviewForm } from "@/components/review-form";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function ReviewPage({ params }: { params: { id: string } }) {
  const extraction = await getExtractionForReview(params.id);
  const signals = extraction.heuristic_signals;
  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold">{extraction.document_filename}</h1>
          <div className="text-sm text-neutral-500 flex items-center gap-3">
            <StatusBadge status={extraction.status} />
            <span>prompt {extraction.prompt_version}</span>
            <span>model {extraction.model}</span>
            <span>min conf {extraction.min_confidence.toFixed(2)}</span>
          </div>
        </div>
        <ReviewForm extraction={extraction} />
      </div>

      <aside className="space-y-4">
        <section>
          <h2 className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Heuristic signals</h2>
          <ul className="text-sm space-y-1">
            {Object.entries(signals).map(([k, v]) => (
              <li key={k} className="flex items-center justify-between border-b border-neutral-900 py-1">
                <span className="text-neutral-300">{k}</span>
                <span className={v ? "text-green-400" : "text-red-400"}>{v ? "✓" : "✗"}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-xs uppercase tracking-wider text-neutral-500 mb-2">OCR text</h2>
          <pre className="text-xs whitespace-pre-wrap rounded bg-neutral-900 p-3 border border-neutral-800 max-h-[60vh] overflow-y-auto">{extraction.ocr_text ?? ""}</pre>
        </section>
      </aside>
    </div>
  );
}
