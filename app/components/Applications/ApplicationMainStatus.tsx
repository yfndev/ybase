import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus } from "@/lib/db/types";
import {
  getApplicationMainStatus,
  type ApplicationMainStatus as MainStatus,
} from "@/lib/applications/mainStatus";
import { cn } from "@/lib/utils";

const FLOW = [
  {
    status: "application",
    label: "Bewerbung",
    active:
      "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-700 dark:bg-sky-950/60 dark:text-sky-100",
  },
  {
    status: "interview",
    label: "Interview",
    active:
      "border-violet-300 bg-violet-50 text-violet-900 dark:border-violet-700 dark:bg-violet-950/60 dark:text-violet-100",
  },
  {
    status: "accepted",
    label: "Angenommen",
    active:
      "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-100",
  },
] as const;

const TERMINAL_STATUS: Record<
  Extract<MainStatus, "rejected" | "withdrawn">,
  { label: string; className: string }
> = {
  rejected: {
    label: "Abgelehnt",
    className:
      "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200",
  },
  withdrawn: {
    label: "Zurückgezogen",
    className:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200",
  },
};

export function ApplicationMainStatus({
  status,
}: {
  status: ApplicationStatus;
}) {
  const mainStatus = getApplicationMainStatus(status);
  const activeIndex = FLOW.findIndex((step) => step.status === mainStatus);
  const terminalStatus =
    mainStatus === "rejected" || mainStatus === "withdrawn"
      ? TERMINAL_STATUS[mainStatus]
      : undefined;

  return (
    <section className="space-y-4 border-t pt-5">
      <h3 className="text-xl font-semibold">Status der Bewerbung</h3>
      {activeIndex >= 0 ? (
        <ol
          className="grid grid-cols-3 gap-2"
          aria-label="Bewerbungsfortschritt"
        >
          {FLOW.map((step, index) => {
            const isActive = index === activeIndex;
            const isCompleted = index < activeIndex;
            return (
              <li
                key={step.status}
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "flex min-h-20 flex-col justify-between border p-3",
                  isActive
                    ? step.active
                    : "border-border bg-background text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center border text-xs font-semibold",
                    isActive
                      ? "border-current"
                      : isCompleted
                        ? "border-foreground bg-foreground text-background"
                        : "border-border",
                  )}
                >
                  {isCompleted ? <Check className="size-3.5" /> : index + 1}
                </span>
                <span className="text-sm font-semibold">{step.label}</span>
              </li>
            );
          })}
        </ol>
      ) : terminalStatus ? (
        <Badge
          variant="outline"
          className={cn(
            "px-4 py-2 text-base font-semibold",
            terminalStatus.className,
          )}
        >
          {terminalStatus.label}
        </Badge>
      ) : null}
    </section>
  );
}
