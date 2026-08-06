"use client";

import { DOCUMENT_STEP_DESCRIPTIONS } from "@/lib/members/documents";
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
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          YBase Onboarding
        </p>
        <h1 className="mt-2 flex items-center gap-2 text-xl font-bold">
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
              : current
                ? current.title
                : "Mitgliedsantrag ausfüllen"}
        </h1>
        <p className="mt-2 max-w-[46rem] text-sm text-muted-foreground">
          {error ??
            (done
              ? "Deine Unterlagen und dein Mitgliedsantrag sind vollständig. Dein YBase-Zugang wird jetzt freigeschaltet."
              : current
                ? `${DOCUMENT_STEP_DESCRIPTIONS[current.type]} Version ${current.versionLabel}.`
                : "Ergänze deine Angaben und unterschreibe den Antrag direkt hier.")}
        </p>
      </div>

      {error ? (
        <p className="mt-6 max-w-[46rem] text-sm text-muted-foreground">
          Bitte wende dich an People &amp; Culture, damit die fehlende
          Konfiguration ergänzt werden kann.
        </p>
      ) : (
        <div className="mt-8 grid flex-1 items-start gap-8 lg:grid-cols-[15rem_1fr]">
          <OnboardingProgress steps={steps} />
          <div className="max-w-[1024px]">
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
          </div>
        </div>
      )}
    </div>
  );
}
