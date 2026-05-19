"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { clsx } from "clsx";
import {
  FileText,
  Inbox,
  Upload,
  Search,
  Settings,
  HelpCircle,
  ChevronDown,
  ReceiptText,
  Building2,
  BarChart3,
} from "lucide-react";

const NAV = [
  { href: "/",          label: "Documents",   icon: FileText },
  { href: "/queue",     label: "Review queue", icon: Inbox },
  { href: "/vendors",   label: "Vendors",     icon: Building2 },
  { href: "/analytics", label: "Analytics",   icon: BarChart3 },
  { href: "/upload",    label: "Upload",      icon: Upload },
];

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      {/* Top bar */}
      <header className="border-b border-border bg-surface">
        <div className="max-w-[1280px] mx-auto px-6 h-14 flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 mr-2">
            <div className="relative flex h-7 w-7 items-center justify-center rounded-md bg-ink text-white shadow-sm">
              <ReceiptText className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[15px] font-semibold tracking-tight text-ink">Ledger</span>
              <span className="text-2xs text-subtle">/ AP extraction</span>
            </div>
          </Link>

          <button className="hidden md:inline-flex items-center gap-1.5 rounded-md hover:bg-surface-2 px-2 py-1 text-sm text-muted">
            Acme Holdings <ChevronDown className="h-3.5 w-3.5" />
          </button>

          <div className="flex-1 max-w-md mx-auto">
            <div className="hidden md:flex items-center gap-2 rounded-md border border-border bg-surface-2/60 px-3 py-1.5 text-sm text-subtle">
              <Search className="h-3.5 w-3.5" />
              <span className="flex-1">Search invoices, vendors, line items…</span>
              <kbd className="h-4 px-1 inline-flex items-center rounded border border-border bg-white text-[10px] text-subtle">⌘K</kbd>
            </div>
          </div>

          <a href={`${API_BASE}/docs`} target="_blank" rel="noreferrer" className="text-sm text-muted hover:text-ink">
            API
          </a>
          <button className="text-muted hover:text-ink"><HelpCircle className="h-4 w-4" /></button>
          <button className="text-muted hover:text-ink"><Settings className="h-4 w-4" /></button>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 text-white text-2xs font-semibold flex items-center justify-center">AS</div>
          </div>
        </div>

        {/* Section nav */}
        <div className="max-w-[1280px] mx-auto px-6 -mt-px">
          <nav className="flex items-center gap-6 text-sm">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={clsx(
                    "inline-flex items-center gap-1.5 py-2.5 -mb-px border-b-2 transition-colors",
                    active
                      ? "text-ink border-accent"
                      : "text-muted hover:text-ink border-transparent",
                  )}
                >
                  <Icon className={clsx("h-3.5 w-3.5", active ? "text-accent" : "text-subtle")} />
                  {n.label}
                </Link>
              );
            })}
            <div className="ml-auto inline-flex items-center gap-1.5 text-2xs text-subtle py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Pipeline · healthy
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
