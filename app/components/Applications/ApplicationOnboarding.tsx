"use client";

import {
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleDot,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { useApplicationMutations } from "@/lib/client/applications/hooks/useApplicationMutations";
import type { ApplicationWithFiles } from "@/lib/db/types";
import { cn } from "@/lib/utils";
import { DATE_TIME_FORMAT } from "./applicationPresentation";

export function ApplicationOnboarding({
  application,
}: {
  application: ApplicationWithFiles;
}) {
  const { startOnboarding, setOnboardingCompleted } = useApplicationMutations();
  const isRegistered = Boolean(application.onboardingUserId);
  const isStarted = Boolean(application.onboardingStartedAt);
  const isCompleted = Boolean(application.onboardingCompletedAt);

  async function start() {
    try {
      await startOnboarding.mutateAsync({ applicationId: application._id });
      toast.success("Onboarding gestartet");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Speichern",
      );
    }
  }

  async function setCompleted(nextCompleted: boolean) {
    try {
      await setOnboardingCompleted.mutateAsync({
        applicationId: application._id,
        completed: nextCompleted,
      });
      toast.success(
        nextCompleted
          ? "Onboarding abgeschlossen"
          : "Onboarding wieder geöffnet",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Speichern",
      );
    }
  }

  let StatusIcon = CircleDashed;
  let statusLabel = "YBase-Registrierung ausstehend";
  let statusTimestamp: number | undefined;
  let statusIconClassName = "text-muted-foreground";
  if (isRegistered) {
    StatusIcon = CircleCheck;
    statusLabel = "Bei YBase registriert";
    statusTimestamp = application.onboardingLinkedAt;
    statusIconClassName = "text-emerald-600";
  }
  if (isStarted) {
    StatusIcon = CircleDot;
    statusLabel = "Im Onboarding";
    statusTimestamp = application.onboardingStartedAt;
    statusIconClassName = "text-blue-600";
  }
  if (isCompleted) {
    StatusIcon = CircleCheck;
    statusLabel = "Onboarding abgeschlossen";
    statusTimestamp = application.onboardingCompletedAt;
    statusIconClassName = "text-emerald-600";
  }
  const isPending =
    startOnboarding.isPending || setOnboardingCompleted.isPending;

  return (
    <section className="space-y-4 border-t pt-5">
      <h3 className="text-xl font-semibold">Onboarding</h3>

      {application.onboardingLinkError ? (
        <div
          className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{application.onboardingLinkError}</span>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <StatusIcon
          className={cn("size-4 shrink-0", statusIconClassName)}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-sm font-medium">{statusLabel}</p>
          {statusTimestamp ? (
            <p className="text-xs text-muted-foreground">
              {DATE_TIME_FORMAT.format(statusTimestamp)}
            </p>
          ) : null}
        </div>
      </div>

      {isRegistered && !isStarted ? (
        <Button
          className="w-full"
          size="default"
          onClick={start}
          disabled={isPending}
        >
          Onboarding starten
        </Button>
      ) : null}

      {isStarted && !isCompleted ? (
        <Button
          className="w-full"
          size="default"
          onClick={() => void setCompleted(true)}
          disabled={isPending}
        >
          Onboarding abschließen
        </Button>
      ) : null}

      {isCompleted ? (
        <Button
          className="h-auto p-0 text-sm font-normal text-muted-foreground"
          variant="link"
          onClick={() => void setCompleted(false)}
          disabled={isPending}
        >
          Wieder öffnen
        </Button>
      ) : null}
    </section>
  );
}
