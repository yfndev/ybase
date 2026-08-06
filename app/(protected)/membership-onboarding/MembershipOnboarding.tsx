"use client";

import {
  getOwnMembershipOnboardingContext,
  type MembershipOnboardingContext,
} from "@/lib/server/memberships/onboardingData";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DocumentStep } from "./DocumentStep";
import { MembershipApplicationStep } from "./MembershipApplicationStep";
import { OnboardingProgress } from "./OnboardingProgress";
import { OnboardingSkeleton } from "./OnboardingSkeleton";

const LOAD_ERROR = "Das Onboarding konnte nicht geladen werden.";

export function MembershipOnboarding() {
  const router = useRouter();
  const [context, setContext] = useState<MembershipOnboardingContext>();
  const [error, setError] = useState<string>();

  const reload = useCallback(async () => {
    try {
      const next = await getOwnMembershipOnboardingContext();
      if ("blocked" in next) {
        setError(next.blocked);
        return;
      }
      setContext(next);
      setError(undefined);
      if (next.activated) router.refresh();
    } catch {
      setError(LOAD_ERROR);
    }
  }, [router]);

  useEffect(() => void reload(), [reload]);

  const open =
    context?.documents.filter(({ status }) => status === "assigned") ?? [];
  const current = open[0];
  const steps = context
    ? [
        ...context.documents.map((document) => ({
          label: document.title,
          complete: document.status === "completed",
        })),
        { label: "Mitgliedsantrag", complete: context.profile.confirmed },
      ]
    : [];
  const done = context?.documentsComplete && context.profile.confirmed;

  return (
    <div className="flex flex-1 flex-col">
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

      {error ? (
        <div className="mt-4 max-w-[46rem] space-y-3 text-sm text-muted-foreground">
          <p>{error}</p>
          <p>
            Bitte wende dich an People &amp; Culture, damit die fehlende
            Konfiguration ergänzt werden kann.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid min-h-0 flex-1 gap-8 lg:grid-cols-[15rem_1fr]">
          <OnboardingProgress steps={steps} />
          <div className="flex min-h-0 flex-col">
            {!context && <OnboardingSkeleton />}
            {context && current && (
              <DocumentStep document={current} onComplete={reload} />
            )}
            {context && !current && !context.profile.confirmed && (
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
      )}
    </div>
  );
}
