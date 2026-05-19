"use client";

import { Badge } from "@/components/ui/badge";
import { Clock, Loader2, CheckCircle2, XCircle, AlertTriangle, Edit3 } from "lucide-react";

type Variant = "default" | "success" | "info" | "warning" | "danger" | "violet" | "neutral";

const META: Record<string, { variant: Variant; icon: React.ReactNode; label: string }> = {
  pending:            { variant: "neutral", icon: <Clock className="h-2.5 w-2.5" />,         label: "Pending" },
  processing:         { variant: "info",    icon: <Loader2 className="h-2.5 w-2.5 animate-spin" />, label: "Processing" },
  extracted:          { variant: "success", icon: <CheckCircle2 className="h-2.5 w-2.5" />,  label: "Extracted" },
  failed:             { variant: "danger",  icon: <XCircle className="h-2.5 w-2.5" />,       label: "Failed" },
  auto_approved:      { variant: "success", icon: <CheckCircle2 className="h-2.5 w-2.5" />,  label: "Auto-approved" },
  needs_review:       { variant: "warning", icon: <AlertTriangle className="h-2.5 w-2.5" />, label: "Needs review" },
  reviewed_corrected: { variant: "violet",  icon: <Edit3 className="h-2.5 w-2.5" />,         label: "Corrected" },
};

export function StatusBadge({ status }: { status: string }) {
  const m = META[status] ?? { variant: "neutral" as Variant, icon: null, label: status.replace(/_/g, " ") };
  return <Badge variant={m.variant}>{m.icon}{m.label}</Badge>;
}
