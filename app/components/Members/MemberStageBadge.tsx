import { Badge } from "@/components/ui/badge";
import { memberStageLabel, type MemberStage } from "@/lib/members/stages";
import { cn } from "@/lib/utils";
import { MemberStageIcon } from "./MemberStageIcon";

const MEMBER_STAGE_BADGE_STYLES: Record<MemberStage, string> = {
  application:
    "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-200",
  interview:
    "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-200",
  onboarding:
    "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-200",
  active:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
  inactive:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
  offboarding_planned:
    "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950/60 dark:text-orange-200",
  offboarding:
    "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200",
  archived:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200",
};

export function MemberStageBadge({
  stage,
  className,
}: {
  stage: MemberStage;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 px-3 py-1 text-sm font-medium",
        MEMBER_STAGE_BADGE_STYLES[stage],
        className,
      )}
    >
      <MemberStageIcon stage={stage} />
      {memberStageLabel(stage)}
    </Badge>
  );
}
