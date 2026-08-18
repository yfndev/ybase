import { Badge } from "@/components/ui/badge";
import {
  APPLICATION_DISPLAY_STATUS_LABELS,
  type ApplicationDisplayStatus,
  getApplicationDisplayStatus,
} from "@/lib/applications/status";
import type { ApplicationWithFiles } from "@/lib/db/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<ApplicationDisplayStatus, string> = {
  received: "border-sky-200 bg-sky-50 text-sky-800",
  review: "border-amber-200 bg-amber-50 text-amber-800",
  interview: "border-violet-200 bg-violet-50 text-violet-800",
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-800",
  ybase_registered: "border-teal-200 bg-teal-50 text-teal-800",
  onboarding_active: "border-blue-200 bg-blue-50 text-blue-800",
  onboarding_completed: "border-slate-300 bg-slate-100 text-slate-800",
  rejected: "border-red-200 bg-red-50 text-red-800",
  withdrawn: "border-slate-200 bg-slate-50 text-slate-700",
};

export function ApplicationStatusBadge({
  application,
}: {
  application: Pick<
    ApplicationWithFiles,
    | "status"
    | "onboardingUserId"
    | "onboardingStartedAt"
    | "onboardingCompletedAt"
  >;
}) {
  const status = getApplicationDisplayStatus(application);

  return (
    <Badge
      variant="outline"
      className={cn("px-3 py-1 text-sm font-medium", STATUS_STYLES[status])}
    >
      {APPLICATION_DISPLAY_STATUS_LABELS[status]}
    </Badge>
  );
}
