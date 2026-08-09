"use client";

import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DocumentStep } from "./DocumentStep";
import { MembershipApplicationStep } from "./MembershipApplicationStep";
import { useOnboarding } from "./OnboardingContext";
import { OnboardingSkeleton } from "./OnboardingSkeleton";

const DATE_FORMAT = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function MembershipOnboarding() {
  const router = useRouter();
  const { context, error, current, done, reload } = useOnboarding();
  const isMembershipPhase = context?.phase === "membership";
  const profile = context?.profile;
  const endsAt = context?.gettingToKnowEndsAt;

  return (
    <div>
      <h1 className="flex items-center gap-2 text-xl font-bold">
        {error && (
          <AlertTriangle
            aria-hidden="true"
            className="size-5 shrink-0 text-destructive"
          />
        )}
        {error
          ? "Onboarding nicht verfügbar"
          : done
            ? isMembershipPhase
              ? "Onboarding abgeschlossen"
              : "Willkommen im Team"
            : isMembershipPhase
              ? "Vereinsmitgliedschaft"
              : "Onboarding"}
      </h1>

      <div className="mt-6">
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
        {context &&
          !error &&
          !current &&
          profile &&
          !profile.applicationSigned && (
            <MembershipApplicationStep profile={profile} onComplete={reload} />
          )}
        {done && !isMembershipPhase && (
          <div className="grid max-w-[46rem] gap-4">
            <p className="text-sm text-muted-foreground">
              Deine Unterlagen sind vollständig. Jetzt startet deine
              Kennenlernphase
              {endsAt ? ` bis zum ${DATE_FORMAT.format(endsAt)}` : ""}. Danach
              besprichst du mit deinem Lead, ob du Vereinsmitglied wirst.
            </p>
            <Button
              type="button"
              variant="primary"
              className="w-fit"
              onClick={() => router.refresh()}
            >
              Los geht&apos;s
            </Button>
          </div>
        )}
        {done && isMembershipPhase && (
          <p className="max-w-[46rem] text-sm text-muted-foreground">
            Deine Unterlagen und dein Mitgliedsantrag sind vollständig. Dein
            YBase-Zugang wird jetzt freigeschaltet.
          </p>
        )}
      </div>
    </div>
  );
}
