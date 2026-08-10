"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OnboardingNavigation({
  canGoPrevious,
  canGoNext,
  finish,
  onPrevious,
  onNext,
}: {
  canGoPrevious: boolean;
  canGoNext: boolean;
  finish: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (!canGoPrevious && !canGoNext && !finish) return null;

  return (
    <nav
      className="mt-8 flex w-full flex-wrap items-center gap-2"
      aria-label="Onboarding-Schritte"
    >
      {canGoPrevious ? (
        <Button type="button" variant="outline" onClick={onPrevious}>
          <ArrowLeft aria-hidden="true" />
          Zurück
        </Button>
      ) : null}
      <Button
        type="button"
        className="ml-auto"
        disabled={!canGoNext}
        onClick={onNext}
      >
        {finish ? "Onboarding abschließen" : "Weiter"}
        <ArrowRight aria-hidden="true" />
      </Button>
    </nav>
  );
}
