import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLM Extraction Review",
  description: "Schema-enforced invoice extraction with human-in-the-loop review.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-neutral-800 px-6 py-3 flex items-center gap-6">
          <Link href="/" className="font-semibold tracking-tight">Extraction Review</Link>
          <nav className="flex gap-4 text-sm text-neutral-400">
            <Link href="/" className="hover:text-neutral-100">Documents</Link>
            <Link href="/queue" className="hover:text-neutral-100">Review queue</Link>
            <Link href="/upload" className="hover:text-neutral-100">Upload</Link>
            <a
              href={(process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000") + "/docs"}
              target="_blank" rel="noreferrer"
              className="hover:text-neutral-100"
            >API</a>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-neutral-800 px-6 py-2 text-xs text-neutral-500">
          Upload → OCR → Claude function calling → per-field confidence → human review
        </footer>
      </body>
    </html>
  );
}
