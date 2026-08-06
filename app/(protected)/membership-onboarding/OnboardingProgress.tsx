import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Circle, CircleDot } from "lucide-react";

const SKELETON_ROWS = ["one", "two", "three", "four"];

export interface ProgressStep {
  label: string;
  complete: boolean;
}

export function OnboardingProgress({ steps }: { steps: ProgressStep[] }) {
  const currentIndex = steps.findIndex((step) => !step.complete);
  if (steps.length === 0) {
    return (
      <div className="mt-8 space-y-4" aria-busy="true">
        {SKELETON_ROWS.map((row) => (
          <div key={row} className="flex items-center gap-3">
            <Skeleton className="size-4 shrink-0 bg-background/25" />
            <Skeleton className="h-4 w-32 bg-background/25" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <ol className="mt-8 space-y-4" aria-label="Fortschritt">
      {steps.map((step, index) => {
        const Icon = step.complete
          ? CheckCircle2
          : index === currentIndex
            ? CircleDot
            : Circle;
        return (
          <li
            key={`${index}-${step.label}`}
            className="flex items-start gap-3 text-sm"
          >
            <Icon
              aria-hidden="true"
              className={
                step.complete
                  ? "mt-0.5 size-4 shrink-0 text-emerald-400"
                  : "mt-0.5 size-4 shrink-0 text-background/70"
              }
            />
            <span
              className={
                index === currentIndex
                  ? "font-medium"
                  : "text-background/75 truncate"
              }
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
