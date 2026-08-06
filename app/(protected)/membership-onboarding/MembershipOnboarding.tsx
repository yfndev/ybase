"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DOCUMENT_STEP_DESCRIPTIONS } from "@/lib/members/documents";
import { signOutWithPostHog } from "@/lib/posthog-client";
import {
  getOwnMembershipOnboardingContext,
  type MembershipOnboardingContext,
} from "@/lib/server/memberships/onboardingData";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  LogOut,
} from "lucide-react";
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
    <main className="flex min-h-screen items-start justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary-foreground">
            <HeaderIcon done={Boolean(done)} failed={Boolean(error)} />
          </div>
          <CardTitle className="text-2xl">
            {error
              ? "Onboarding nicht verfügbar"
              : done
                ? "Onboarding abgeschlossen"
                : current
                  ? current.title
                  : "Mitgliedsantrag ausfüllen"}
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            {error ??
              (done
                ? "Deine Unterlagen und dein Mitgliedsantrag sind vollständig. Dein YBase-Zugang wird jetzt freigeschaltet."
                : current
                  ? `${DOCUMENT_STEP_DESCRIPTIONS[current.type]} Version ${current.versionLabel}.`
                  : "Ergänze deine Angaben und unterschreibe den Antrag direkt hier.")}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {!context && !error && <OnboardingSkeleton />}
          {error && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Bitte wende dich an People &amp; Culture, damit die fehlende
              Konfiguration ergänzt werden kann.
            </p>
          )}
          {context && !error && (
            <>
              <OnboardingProgress steps={steps} />
              {current && (
                <DocumentStep document={current} onComplete={reload} />
              )}
              {!current && !context.profile.confirmed && (
                <MembershipApplicationStep
                  profile={context.profile}
                  onComplete={reload}
                />
              )}
            </>
          )}

          <div className="border-t pt-6 text-center">
            <Button variant="outline" onClick={() => void signOutWithPostHog()}>
              <LogOut aria-hidden="true" />
              Abmelden
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function HeaderIcon({ done, failed }: { done: boolean; failed: boolean }) {
  if (failed) {
    return <AlertTriangle aria-hidden="true" className="size-6" />;
  }
  if (done) {
    return <CheckCircle2 aria-hidden="true" className="size-6" />;
  }
  return <ClipboardCheck aria-hidden="true" className="size-6" />;
}
