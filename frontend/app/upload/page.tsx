"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { uploadPdf } from "@/lib/api";

export default function UploadPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      await uploadPdf(file);
      router.push("/");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Upload PDF</h1>
      <p className="text-sm text-neutral-400">
        PDF only, up to 20 MB. The Celery worker will OCR and run extraction; refresh
        the documents list to watch status transition.
      </p>
      <label className="block rounded border border-dashed border-neutral-700 hover:border-sky-500 p-12 text-center cursor-pointer">
        <input type="file" accept="application/pdf" className="hidden" onChange={onChange} disabled={busy} />
        {busy ? (
          <span className="inline-flex items-center gap-2 text-sky-400"><Loader2 className="h-5 w-5 animate-spin" /> Uploading…</span>
        ) : (
          <span className="inline-flex items-center gap-2 text-neutral-300"><Upload className="h-5 w-5" /> Click to pick a PDF</span>
        )}
      </label>
      {err ? <div className="text-red-300 text-sm">{err}</div> : null}
    </div>
  );
}
