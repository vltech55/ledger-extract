"use client";

import {
  CalendarDays,
  TrendingUp,
  Receipt,
  Coins,
  Users,
  Building2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Card, CardHeader, CardBody } from "@/components/ui/card";

const DAILY = [
  { d: "May 01", auto: 18, review: 4, gmv: 12400 },
  { d: "May 02", auto: 22, review: 3, gmv: 14820 },
  { d: "May 03", auto: 14, review: 6, gmv: 9810 },
  { d: "May 04", auto: 28, review: 5, gmv: 16210 },
  { d: "May 05", auto: 31, review: 7, gmv: 22014 },
  { d: "May 06", auto: 24, review: 4, gmv: 17604 },
  { d: "May 07", auto: 30, review: 5, gmv: 20142 },
  { d: "May 08", auto: 19, review: 2, gmv: 11842 },
  { d: "May 09", auto: 34, review: 8, gmv: 24501 },
  { d: "May 10", auto: 27, review: 6, gmv: 18301 },
  { d: "May 11", auto: 41, review: 4, gmv: 28412 },
  { d: "May 12", auto: 38, review: 9, gmv: 26201 },
  { d: "May 13", auto: 22, review: 3, gmv: 14918 },
  { d: "May 14", auto: 29, review: 7, gmv: 19844 },
  { d: "May 15", auto: 36, review: 5, gmv: 24102 },
  { d: "May 16", auto: 31, review: 4, gmv: 21412 },
  { d: "May 17", auto: 26, review: 6, gmv: 17821 },
  { d: "May 18", auto: 33, review: 5, gmv: 23104 },
];

const VENDOR_TOP = [
  { name: "Amazon Web Services", v: 18402.91, n: 1 },
  { name: "Datadog Inc.", v: 14760.00, n: 3 },
  { name: "Plaid Inc.", v: 13200.00, n: 3 },
  { name: "Stripe, Inc.", v: 9634.26, n: 3 },
  { name: "Acme Robotics LLC", v: 8521.50, n: 3 },
  { name: "Twilio Inc.", v: 5521.98, n: 3 },
  { name: "Sentry", v: 3546.00, n: 3 },
  { name: "CloudSky Logistics", v: 3627.00, n: 3 },
  { name: "GitHub Inc.", v: 4440.00, n: 3 },
  { name: "Heroku", v: 629.97, n: 3 },
];

const STATUS_DAILY = [
  { d: "Apr 18", auto: 142, review: 31, corrected: 18 },
  { d: "Apr 25", auto: 167, review: 28, corrected: 22 },
  { d: "May 02", auto: 198, review: 24, corrected: 19 },
  { d: "May 09", auto: 224, review: 21, corrected: 14 },
  { d: "May 16", auto: 248, review: 18, corrected: 11 },
];

export default function AnalyticsPage() {
  return (
    <div className="px-6 py-6 max-w-[1280px] mx-auto space-y-6 animate-slide-up">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Period analytics</h1>
          <p className="text-sm text-muted mt-1">
            <CalendarDays className="inline h-3 w-3 -mt-0.5" /> May 2026 · 18 of 31 days elapsed · books close <span className="font-mono text-ink-2">Jun 5, 23:59 UTC</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-2xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft text-accent px-2.5 py-0.5"><TrendingUp className="h-3 w-3" /> auto-approve rate 86.2%</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-soft text-warn px-2.5 py-0.5">3 invoices flagged this week</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Kpi icon={<Receipt className="h-3.5 w-3.5" />} label="Invoices · MTD" value="487" delta="+18.4%" />
        <Kpi icon={<Coins   className="h-3.5 w-3.5" />} label="GMV processed"  value="$326,418" delta="+12.1%" />
        <Kpi icon={<Building2 className="h-3.5 w-3.5" />} label="Active vendors" value="142" delta="+9 new" />
        <Kpi icon={<Users   className="h-3.5 w-3.5" />} label="Review touches" value="61" delta="-22%" green />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Daily intake" subtitle="Documents extracted per day · auto-approved vs review queued" />
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={DAILY} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0a8b6a" stopOpacity={0.5} /><stop offset="100%" stopColor="#0a8b6a" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c87b1e" stopOpacity={0.5} /><stop offset="100%" stopColor="#c87b1e" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid stroke="#ececea" vertical={false} />
                <XAxis dataKey="d" stroke="#8a8f99" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#8a8f99" fontSize={11} tickLine={false} axisLine={false} width={32} />
                <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #ececea", borderRadius: 8, fontSize: 12, color: "#0f1419" }} />
                <Area type="monotone" dataKey="auto"   name="Auto-approved" stroke="#0a8b6a" strokeWidth={2} fill="url(#ga)" isAnimationActive={false} />
                <Area type="monotone" dataKey="review" name="Needs review"  stroke="#c87b1e" strokeWidth={2} fill="url(#gr)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-3 flex items-center gap-5 text-2xs text-muted">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent"></span>Auto-approved · 487</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warn"></span>Needs review · 93</span>
              <span className="ml-auto text-subtle font-mono">avg 32/day</span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Auto-approve rate" subtitle="Trending up week over week" />
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={STATUS_DAILY} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="#ececea" vertical={false} />
                <XAxis dataKey="d" stroke="#8a8f99" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#8a8f99" fontSize={11} tickLine={false} axisLine={false} width={32} />
                <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #ececea", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="auto"      stackId="a" fill="#0a8b6a" isAnimationActive={false} />
                <Bar dataKey="review"    stackId="a" fill="#c87b1e" isAnimationActive={false} />
                <Bar dataKey="corrected" stackId="a" fill="#6755d4" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 grid grid-cols-3 gap-2 text-2xs">
              <div><span className="inline-block h-2 w-2 rounded-full bg-accent mr-1.5"></span>Auto</div>
              <div><span className="inline-block h-2 w-2 rounded-full bg-warn mr-1.5"></span>Review</div>
              <div><span className="inline-block h-2 w-2 rounded-full bg-violet mr-1.5"></span>Corrected</div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Top vendors · MTD" subtitle="By billed amount, May 2026" />
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-2xs uppercase tracking-wider text-subtle bg-surface-2/60">
              <th className="px-5 py-2.5 font-medium">Vendor</th>
              <th className="px-2 py-2.5 font-medium">Invoices</th>
              <th className="px-2 py-2.5 font-medium">Total billed</th>
              <th className="px-2 py-2.5 font-medium">Share</th>
            </tr>
          </thead>
          <tbody>
            {VENDOR_TOP.map((v) => {
              const total = VENDOR_TOP.reduce((s, x) => s + x.v, 0);
              const pct = (v.v / total) * 100;
              return (
                <tr key={v.name} className="border-t border-border hover:bg-surface-2/50">
                  <td className="px-5 py-3 text-ink-2 font-medium">{v.name}</td>
                  <td className="px-2 py-3 font-mono tabular text-ink-2">{v.n}</td>
                  <td className="px-2 py-3 font-mono tabular text-ink">${v.v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-[200px] h-1.5 rounded-full bg-surface-2 overflow-hidden">
                        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-mono text-xs tabular text-muted w-12 text-right">{pct.toFixed(1)}%</span>
                    </div>
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

function Kpi({ icon, label, value, delta, green = false }: { icon: React.ReactNode; label: string; value: string; delta: string; green?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-5 py-4 shadow-sm">
      <div className="flex items-center gap-2 text-2xs uppercase tracking-wider text-subtle">{icon}{label}</div>
      <div className="text-2xl font-semibold tabular mt-1 text-ink">{value}</div>
      <div className={`text-2xs font-medium mt-0.5 ${green ? "text-accent" : "text-accent"}`}>{delta}</div>
    </div>
  );
}
