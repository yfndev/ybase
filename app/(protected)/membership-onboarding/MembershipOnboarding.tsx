"use client";

import { Button } from "@/components/ui/button";
import { signOutWithPostHog } from "@/lib/posthog-client";
import {
  getOwnMembershipOnboardingContext,
  type MembershipOnboardingContext,
} from "@/lib/server/memberships/onboardingData";
import { AlertTriangle, CheckCircle2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DocumentTasks } from "./DocumentTasks";
import { MembershipApplicationStep } from "./MembershipApplicationStep";
import { OnboardingProgress } from "./OnboardingProgress";
import { OnboardingSkeleton } from "./OnboardingSkeleton";

export function MembershipOnboarding() {
  const router = useRouter();
  const [context, setContext] = useState<MembershipOnboardingContext>();
  const [error, setError] = useState<string>();

  const reload = useCallback(async () => {
    try {
      const next = await getOwnMembershipOnboardingContext();
      setContext(next);
      setError(undefined);
      if (next.activated) router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Onboarding konnte nicht geladen werden.",
      );
    }
  }, [router]);

  useEffect(() => void reload(), [reload]);

  const steps = context
    ? [
        ...context.documents.map((document) => ({
          label: document.title,
          complete: document.status === "completed",
        })),
        { label: "Mitgliedsantrag", complete: context.profile.confirmed },
      ]
    : [];

  return (
    <main className="min-h-svh bg-muted/30 p-4 sm:p-8">
      <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-5xl overflow-hidden rounded-2xl border bg-background shadow-sm lg:grid-cols-[17rem_1fr]">
        <aside className="flex flex-col justify-between bg-foreground p-6 text-background">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-background/55 uppercase">
              YBase Onboarding
            </p>
            <h2 className="mt-4 text-xl font-semibold leading-tight">
              Deine Mitgliedschaft.
              <br />
              Direkt in YBase.
            </h2>
            <OnboardingProgress steps={steps} />
          </div>
          <Button
            variant="ghost"
            className="mt-8 justify-start text-background hover:bg-background/10 hover:text-background"
            onClick={() => void signOutWithPostHog()}
          >
            <LogOut aria-hidden="true" />
            Abmelden
          </Button>
        </aside>

        <div className="p-6 sm:p-10 lg:p-14">
          {!context && !error && <OnboardingSkeleton />}
          {error && <OnboardingError message={error} />}
          {context && !context.documentsComplete && (
            <DocumentTasks documents={context.documents} onComplete={reload} />
          )}
          {context?.documentsComplete && !context.profile.confirmed && (
            <MembershipApplicationStep
              profile={context.profile}
              totalSteps={steps.length}
              onComplete={reload}
            />
          )}
          {context?.documentsComplete && context.profile.confirmed && (
            <section className="max-w-xl" aria-live="polite">
              <CheckCircle2 className="mb-5 size-10 text-emerald-600" />
              <h1 className="text-2xl font-semibold">
                Onboarding abgeschlossen
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Deine Unterlagen und dein Mitgliedsantrag sind vollständig. Dein
                YBase-Zugang wird jetzt freigeschaltet.
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function OnboardingError({ message }: { message: string }) {
  return (
    <section className="max-w-xl" role="alert">
      <AlertTriangle className="mb-5 size-10 text-amber-600" />
      <h1 className="text-2xl font-semibold">Onboarding nicht verfügbar</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{message}</p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Bitte wende dich an People &amp; Culture, damit die fehlende
        Konfiguration ergänzt werden kann.
      </p>
    </section>
  );
}
