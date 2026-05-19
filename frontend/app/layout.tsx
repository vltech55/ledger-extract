import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: {
    default: "Invoice Extraction · schema-enforced LLM extraction",
    template: "%s · Invoice Extraction",
  },
  description: "Schema-enforced invoice extraction with per-field confidence scoring and human-in-the-loop review.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "Invoice Extraction · schema-enforced LLM extraction",
    description: "Per-field confidence scoring with HITL review queue.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
