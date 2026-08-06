import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Circle, Clock3 } from "lucide-react";

const SKELETON_ROWS = ["one", "two", "three", "four"];

export interface ProgressStep {
  label: string;
  complete: boolean;
}

export function OnboardingProgress({ steps }: { steps: ProgressStep[] }) {
  if (steps.length === 0) {
    return (
      <div className="space-y-3" aria-busy="true">
        {SKELETON_ROWS.map((row) => (
          <div key={row} className="flex items-center gap-3">
            <Skeleton className="size-5 shrink-0" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>
    );
  }

  const currentIndex = steps.findIndex((step) => !step.complete);
  return (
    <ol className="space-y-3" aria-label="Onboarding-Fortschritt">
      {steps.map((step, index) => {
        const current = index === currentIndex;
        const Icon = step.complete ? CheckCircle2 : current ? Clock3 : Circle;
        return (
          <li
            key={`${index}-${step.label}`}
            className="flex items-center gap-3 text-sm"
          >
            <Icon
              aria-hidden="true"
              className={
                step.complete
                  ? "size-5 shrink-0 text-emerald-600"
                  : current
                    ? "size-5 shrink-0 text-foreground"
                    : "size-5 shrink-0 text-muted-foreground/50"
              }
            />
            <span
              className={current ? "font-semibold" : "text-muted-foreground"}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
