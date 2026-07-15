import { Badge } from "@/components/ui/badge";
import { APPLICATION_STATUS_LABELS } from "@/lib/applications/status";
import type { ApplicationStatus } from "@/lib/db/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  received: "border-sky-200 bg-sky-50 text-sky-800",
  review: "border-amber-200 bg-amber-50 text-amber-800",
  interview: "border-violet-200 bg-violet-50 text-violet-800",
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-red-200 bg-red-50 text-red-800",
  withdrawn: "border-slate-200 bg-slate-50 text-slate-700",
};

export function ApplicationStatusBadge({
  status,
}: {
  status: ApplicationStatus;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full", STATUS_STYLES[status])}
    >
      {APPLICATION_STATUS_LABELS[status]}
    </Badge>
  );
}
