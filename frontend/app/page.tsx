import Link from "next/link";
import { listDocuments } from "@/lib/api";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function Page() {
  let docs: Awaited<ReturnType<typeof listDocuments>> = [];
  let err: string | null = null;
  try { docs = await listDocuments(); } catch (e) { err = (e as Error).message; }

  if (err) return <div className="p-6 text-red-300">Failed to load: {err}</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Documents ({docs.length})</h1>
      {docs.length === 0 ? (
        <div className="text-neutral-400">
          No documents yet. <Link href="/upload" className="text-sky-400 underline">Upload one</Link>.
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b border-neutral-800">
              <th className="py-2">Filename</th>
              <th>Status</th>
              <th>Extraction</th>
              <th>Min conf</th>
              <th>Uploaded</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className="border-b border-neutral-900">
                <td className="py-2">{d.filename}</td>
                <td><StatusBadge status={d.status} /></td>
                <td>{d.extraction_status ? <StatusBadge status={d.extraction_status} /> : <span className="text-neutral-600">—</span>}</td>
                <td className="font-mono">{d.min_confidence !== null ? d.min_confidence.toFixed(2) : "—"}</td>
                <td className="text-neutral-400 text-xs">{new Date(d.uploaded_at).toLocaleString()}</td>
                <td>
                  {d.extraction_id ? (
                    <Link href={`/review/${d.extraction_id}`} className="text-sky-400 hover:underline">
                      open
                    </Link>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
