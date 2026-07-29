import type { MemberStage } from "@/lib/members/stages";
import { cn } from "@/lib/utils";
import { PlaneTakeoff } from "lucide-react";

export function MemberStageIcon({
  stage,
  className,
}: {
  stage: MemberStage;
  className?: string;
}) {
  if (stage !== "offboarding_planned") return null;

  return (
    <PlaneTakeoff
      aria-hidden="true"
      className={cn("size-4 shrink-0", className)}
    />
  );
}
