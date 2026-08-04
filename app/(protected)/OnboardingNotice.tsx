"use client";

import {
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Clock3,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutWithPostHog } from "@/lib/posthog-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TeamOnboardingStatus } from "@/lib/db/types";

interface Props {
  onboardingStatus: TeamOnboardingStatus;
}

interface StepProps {
  state: "completed" | "current" | "pending";
  title: string;
  description: string;
}

function OnboardingStep({ state, title, description }: StepProps) {
  const Icon =
    state === "completed"
      ? CheckCircle2
      : state === "current"
        ? Clock3
        : Circle;

  return (
    <li className="flex gap-3">
      <Icon
        aria-hidden="true"
        className={
          state === "completed"
            ? "mt-0.5 size-5 shrink-0 text-emerald-600"
            : state === "current"
              ? "mt-0.5 size-5 shrink-0 text-primary"
              : "mt-0.5 size-5 shrink-0 text-muted-foreground/50"
        }
      />
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </li>
  );
}

export function OnboardingNotice({ onboardingStatus }: Props) {
  const isOnboardingComplete = onboardingStatus === "completed";
  const isOnboardingStarted = onboardingStatus === "in_progress";
  const title = isOnboardingComplete
    ? "Deine Unterlagen werden geprüft"
    : isOnboardingStarted
      ? "Onboarding abschließen"
      : "Dein Onboarding wird vorbereitet";

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ClipboardCheck aria-hidden="true" className="size-6" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Schließe die erforderlichen Unterlagen ab. Nach der Prüfung durch
            People &amp; Culture wird dein vollständiger YBase-Zugang
            freigeschaltet.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <ol className="space-y-6" aria-label="Onboarding-Fortschritt">
            <OnboardingStep
              state="completed"
              title="YBase-Zugang eingerichtet"
              description="Dein Konto wurde angelegt und mit deinem Member-Profil verknüpft."
            />
            <OnboardingStep
              state={isOnboardingComplete ? "completed" : "current"}
              title="Unterlagen ausfüllen und bestätigen"
              description={
                isOnboardingComplete
                  ? "Alle erforderlichen Unterlagen wurden abgeschlossen."
                  : isOnboardingStarted
                    ? "Schließe die dir zugesandten Unterlagen ab, darunter die Datenschutzhinweise und weitere erforderliche Erklärungen."
                    : "People & Culture stellt dir die erforderlichen Unterlagen bereit."
              }
            />
            <OnboardingStep
              state={isOnboardingComplete ? "current" : "pending"}
              title="Freigabe durch People & Culture"
              description={
                isOnboardingComplete
                  ? "People & Culture prüft deine Angaben und schaltet anschließend deinen vollständigen Zugang frei."
                  : "Die Prüfung beginnt, sobald du alle erforderlichen Unterlagen abgeschlossen hast."
              }
            />
          </ol>

          <div className="mt-8 border-t pt-6 text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              Bei Fragen zu deinen Aufgaben wende dich bitte an People &amp;
              Culture.
            </p>
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
