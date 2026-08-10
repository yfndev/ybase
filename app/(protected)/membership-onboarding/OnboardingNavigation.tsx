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
      className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6"
      aria-label="Onboarding-Schritte"
    >
      <div>
        {canGoPrevious ? (
          <Button type="button" variant="outline" onClick={onPrevious}>
            <ArrowLeft aria-hidden="true" />
            Zurück
          </Button>
        ) : null}
      </div>
      <Button type="button" disabled={!canGoNext} onClick={onNext}>
        {finish ? "Onboarding abschließen" : "Weiter"}
        <ArrowRight aria-hidden="true" />
      </Button>
    </nav>
  );
}
