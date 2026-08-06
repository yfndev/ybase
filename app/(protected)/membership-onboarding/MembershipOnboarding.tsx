"use client";

import { AlertTriangle } from "lucide-react";
import { DocumentStep } from "./DocumentStep";
import { MembershipApplicationStep } from "./MembershipApplicationStep";
import { useOnboarding } from "./OnboardingContext";
import { OnboardingSkeleton } from "./OnboardingSkeleton";

export function MembershipOnboarding() {
  const { context, error, current, done, reload } = useOnboarding();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="flex shrink-0 items-center gap-2 text-xl font-bold">
        {error && (
          <AlertTriangle
            aria-hidden="true"
            className="size-5 shrink-0 text-destructive"
          />
        )}
        {error
          ? "Onboarding nicht verfügbar"
          : done
            ? "Onboarding abgeschlossen"
            : "Onboarding"}
      </h1>

      <div className="mt-6 flex min-h-0 flex-1 flex-col">
        {error && (
          <div className="max-w-[46rem] space-y-3 text-sm text-muted-foreground">
            <p>{error}</p>
            <p>
              Bitte wende dich an People &amp; Culture, damit die fehlende
              Konfiguration ergänzt werden kann.
            </p>
          </div>
        )}
        {!context && !error && <OnboardingSkeleton />}
        {context && !error && current && (
          <DocumentStep document={current} onComplete={reload} />
        )}
        {context && !error && !current && !context.profile.confirmed && (
          <MembershipApplicationStep
            profile={context.profile}
            onComplete={reload}
          />
        )}
        {done && (
          <p className="max-w-[46rem] text-sm text-muted-foreground">
            Deine Unterlagen und dein Mitgliedsantrag sind vollständig. Dein
            YBase-Zugang wird jetzt freigeschaltet.
          </p>
        )}
      </div>
    </div>
  );
}
