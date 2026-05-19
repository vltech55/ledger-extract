"use client";

import {
  Building2,
  TrendingUp,
  TrendingDown,
  Search,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const VENDORS = [
  { name: "Amazon Web Services", aka: "AWS",  category: "Cloud",      n: 1,  mtd: 18402.91, lifetime: 198_140, conf: 0.93, ach: 12.4, anomaly: false },
  { name: "Datadog Inc.",          aka: "DD",  category: "Observability", n: 3,  mtd: 14760.00, lifetime: 142_010, conf: 0.96, ach: 4.1, anomaly: false },
  { name: "Plaid Inc.",            aka: "PL",  category: "Payments",   n: 3,  mtd: 13200.00, lifetime: 88_416,  conf: 0.81, ach: -3.6, anomaly: true },
  { name: "Stripe, Inc.",          aka: "ST",  category: "Payments",   n: 3,  mtd: 9634.26,  lifetime: 121_481, conf: 0.88, ach: 6.4,  anomaly: false },
  { name: "Acme Robotics LLC",     aka: "AR",  category: "Hardware",   n: 3,  mtd: 8521.50,  lifetime: 47_812,  conf: 0.97, ach: 8.2,  anomaly: false },
  { name: "Twilio Inc.",           aka: "TW",  category: "Messaging",  n: 3,  mtd: 5521.98,  lifetime: 65_021,  conf: 0.58, ach: -8.1, anomaly: true },
  { name: "GitHub Inc.",           aka: "GH",  category: "DevOps",     n: 3,  mtd: 4440.00,  lifetime: 58_440,  conf: 0.71, ach: 1.2,  anomaly: false },
  { name: "Functional Software",   aka: "SN",  category: "Observability", n: 3,  mtd: 3546.00,  lifetime: 41_018,  conf: 0.91, ach: 2.4,  anomaly: false },
  { name: "CloudSky Logistics",    aka: "CS",  category: "Shipping",   n: 3,  mtd: 3627.00,  lifetime: 18_412,  conf: 0.62, ach: -1.1, anomaly: true },
  { name: "Heroku",                aka: "HK",  category: "Cloud",      n: 3,  mtd: 629.97,   lifetime: 9_410,   conf: 0.94, ach: 0.4,  anomaly: false },
];

const CATS = ["All · 142", "Cloud · 24", "Observability · 11", "Payments · 18", "Messaging · 6", "Hardware · 8", "DevOps · 12", "Shipping · 14"] as const;

export default function VendorsPage() {
  return (
    <div className="px-6 py-6 max-w-[1280px] mx-auto space-y-6 animate-slide-up">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Vendors</h1>
          <p className="text-sm text-muted mt-1">
            142 active vendors · billed <span className="font-mono text-ink-2">$326,418</span> MTD · 3 with low-confidence extractions.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-ink text-white px-3 py-1.5 text-sm font-medium hover:bg-ink-2 shadow-sm">
          <Building2 className="h-4 w-4" /> Add vendor
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1 max-w-md rounded-md border border-border bg-surface-2/60 px-3 py-1.5 text-sm">
          <Search className="h-3.5 w-3.5 text-subtle" />
          <input placeholder="Find a vendor by name, alias, EIN, address" className="flex-1 bg-transparent outline-none placeholder:text-subtle text-ink" />
        </div>
        {CATS.map((c, i) => (
          <button key={c} className={`rounded-full border px-3 py-1 text-xs ${i === 0 ? "border-accent bg-accent-soft text-accent font-medium" : "border-border bg-white text-muted hover:bg-surface-2"}`}>
            {c}
          </button>
        ))}
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-2xs uppercase tracking-wider text-subtle bg-surface-2/60">
              <th className="px-5 py-2.5 font-medium">Vendor</th>
              <th className="px-2 py-2.5 font-medium">Category</th>
              <th className="px-2 py-2.5 font-medium">Invoices (MTD)</th>
              <th className="px-2 py-2.5 font-medium">MTD billed</th>
              <th className="px-2 py-2.5 font-medium">Lifetime</th>
              <th className="px-2 py-2.5 font-medium">Avg conf.</th>
              <th className="px-2 py-2.5 font-medium">Δ MoM</th>
              <th className="px-2 py-2.5 font-medium">Status</th>
              <th className="px-5 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {VENDORS.map((v) => {
              const confTier = v.conf >= 0.85 ? "high" : v.conf >= 0.65 ? "med" : "low";
              const confColor = confTier === "high" ? "text-accent" : confTier === "med" ? "text-warn" : "text-rose";
              return (
                <tr key={v.name} className="border-t border-border hover:bg-surface-2/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-md bg-surface-2 border border-border flex items-center justify-center font-mono font-bold text-xs text-ink-2">{v.aka}</div>
                      <div>
                        <div className="text-ink font-medium">{v.name}</div>
                        <div className="text-2xs text-subtle font-mono tabular">vendor_{v.name.split(' ')[0].toLowerCase()}_{Math.floor(Math.random()*9000+1000)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3"><span className="inline-flex items-center gap-1 rounded-full bg-violet-soft text-violet px-2 py-0.5 text-2xs font-medium">{v.category}</span></td>
                  <td className="px-2 py-3 font-mono tabular text-ink-2">{v.n}</td>
                  <td className="px-2 py-3 font-mono tabular text-ink">${v.mtd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-2 py-3 font-mono tabular text-muted">${v.lifetime.toLocaleString()}</td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2 max-w-[140px]">
                      <span className={`font-mono text-xs tabular ${confColor}`}>{v.conf.toFixed(2)}</span>
                      <div className="flex-1 conf-bar"><div className={`conf-bar-fill ${confTier}`} style={{ width: `${v.conf * 100}%` }} /></div>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    {v.ach > 0 ? (
                      <span className="inline-flex items-center gap-0.5 text-2xs font-mono text-accent"><TrendingUp className="h-3 w-3" />+{v.ach.toFixed(1)}%</span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-2xs font-mono text-rose"><TrendingDown className="h-3 w-3" />{v.ach.toFixed(1)}%</span>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    {v.anomaly ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium bg-warn-soft text-warn"><AlertTriangle className="h-2.5 w-2.5" /> review</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium bg-accent-soft text-accent"><CheckCircle2 className="h-2.5 w-2.5" /> clean</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <a className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover">Detail <ArrowUpRight className="h-3 w-3" /></a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
