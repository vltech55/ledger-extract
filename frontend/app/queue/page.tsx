import Link from "next/link";
import { reviewQueue } from "@/lib/api";
import { StatusBadge } from "@/components/status-badge";
import { ConfidenceBar } from "@/components/confidence-bar";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  let queue: Awaited<ReturnType<typeof reviewQueue>> = [];
  let err: string | null = null;
  try { queue = await reviewQueue(); } catch (e) { err = (e as Error).message; }

  if (err) return <div className="p-6 text-red-300">{err}</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-1">Review queue</h1>
      <p className="text-sm text-neutral-400 mb-4">
        Extractions where at least one field's adjusted confidence is below auto-approve.
        Sorted by lowest confidence first.
      </p>
      {queue.length === 0 ? (
        <div className="text-neutral-400">Nothing to review. 🎉</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b border-neutral-800">
              <th className="py-2">Document</th>
              <th>Prompt</th>
              <th>Min conf</th>
              <th>Mean conf</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {queue.map((e) => (
              <tr key={e.id} className="border-b border-neutral-900">
                <td className="py-2">{e.document_filename}</td>
                <td className="font-mono text-neutral-400">{e.prompt_version}</td>
                <td className="flex items-center gap-2 py-2"><ConfidenceBar value={e.min_confidence} /><span className="font-mono text-xs">{e.min_confidence.toFixed(2)}</span></td>
                <td className="font-mono text-xs">{e.mean_confidence.toFixed(2)}</td>
                <td><StatusBadge status={e.status} /></td>
                <td><Link href={`/review/${e.id}`} className="text-sky-400 hover:underline">review →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
