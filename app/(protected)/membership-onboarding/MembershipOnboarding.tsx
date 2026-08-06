"use client";

import { Button } from "@/components/ui/button";
import { DOCUMENT_STEP_DESCRIPTIONS } from "@/lib/members/documents";
import { signOutWithPostHog } from "@/lib/posthog-client";
import {
  getOwnMembershipOnboardingContext,
  type MembershipOnboardingContext,
} from "@/lib/server/memberships/onboardingData";
import { AlertTriangle, LogOut } from "lucide-react";
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
    <main className="flex min-h-svh flex-col bg-sidebar p-2 sm:p-3 lg:p-4">
      <div className="flex flex-1 flex-col rounded-[0.25rem] border bg-background p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
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
          <Button variant="outline" onClick={() => void signOutWithPostHog()}>
            <LogOut aria-hidden="true" />
            Abmelden
          </Button>
        </div>

        <div className="mt-8 grid flex-1 items-start gap-8 lg:grid-cols-[15rem_1fr]">
          <OnboardingProgress steps={steps} />
          <div className="max-w-[1024px]">
            {!context && !error && <OnboardingSkeleton />}
            {error && (
              <p className="text-sm text-muted-foreground">
                Bitte wende dich an People &amp; Culture, damit die fehlende
                Konfiguration ergänzt werden kann.
              </p>
            )}
            {context && !error && current && (
              <DocumentStep document={current} onComplete={reload} />
            )}
            {context && !error && !current && !context.profile.confirmed && (
              <MembershipApplicationStep
                profile={context.profile}
                onComplete={reload}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
