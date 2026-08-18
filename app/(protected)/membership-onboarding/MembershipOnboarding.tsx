"use client";

import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { DocumentStep } from "./DocumentStep";
import { MembershipApplicationStep } from "./MembershipApplicationStep";
import { useOnboarding } from "./OnboardingContext";
import { OnboardingNavigation } from "./OnboardingNavigation";
import { OnboardingSkeleton } from "./OnboardingSkeleton";
import { WelcomeStep } from "./WelcomeStep";

export function MembershipOnboarding() {
  const router = useRouter();
  const {
    context,
    error,
    activeStep,
    canGoPrevious,
    canGoNext,
    isLastStep,
    done,
    goPrevious,
    goNext,
    reload,
  } = useOnboarding();
  const isMembershipPhase = context?.phase === "membership";
  const profile = context?.profile;
  const finishDocuments = Boolean(context?.phase === "documents" && isLastStep);

  function continueOnboarding() {
    if (finishDocuments && done) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      router.refresh();
      return;
    }
    goNext();
  }

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
          : (activeStep?.title ??
            (isMembershipPhase ? "Vereinsmitgliedschaft" : "Onboarding"))}
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
        {context && !error && activeStep?.kind === "welcome" && <WelcomeStep />}
        {context && !error && activeStep?.kind === "document" && (
          <DocumentStep document={activeStep.document} onComplete={reload} />
        )}
        {context &&
          !error &&
          activeStep?.kind === "membership-application" &&
          profile &&
          !profile.applicationSigned && (
            <MembershipApplicationStep profile={profile} onComplete={reload} />
          )}
        {done && isMembershipPhase && !activeStep && (
          <p className="max-w-[46rem] text-sm text-muted-foreground">
            Deine Unterlagen und dein Mitgliedsantrag sind vollständig. Dein
            YBase-Zugang wird jetzt freigeschaltet.
          </p>
        )}
        {context && !error && activeStep && (
          <OnboardingNavigation
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext || (finishDocuments && done)}
            finish={finishDocuments}
            onPrevious={goPrevious}
            onNext={continueOnboarding}
          />
        )}
      </div>
    </div>
  );
}
