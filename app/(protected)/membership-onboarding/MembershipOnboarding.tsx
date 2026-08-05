"use client";

import { Button } from "@/components/ui/button";
import {
  getOwnMembershipOnboardingContext,
  type MembershipOnboardingContext,
} from "@/lib/server/memberships/onboardingData";
import { signOutWithPostHog } from "@/lib/posthog-client";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  FileCheck2,
  Loader2,
  LogOut,
  UserRoundCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DocumentTasks } from "./DocumentTasks";
import { ProfileStep } from "./ProfileStep";

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

  const assignedDocuments =
    context?.documents.filter(({ status }) => status === "assigned") ?? [];
  const profileComplete = context?.profile.confirmed === true;

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
            <ol className="mt-8 space-y-5" aria-label="Fortschritt">
              <ProgressItem
                complete={profileComplete}
                current={!profileComplete}
                icon={UserRoundCheck}
                label="Mitgliedsdaten"
              />
              <ProgressItem
                complete={profileComplete && assignedDocuments.length === 0}
                current={profileComplete && assignedDocuments.length > 0}
                icon={FileCheck2}
                label="Unterlagen"
              />
            </ol>
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
          {!context && !error && (
            <div className="flex min-h-96 items-center justify-center">
              <Loader2
                aria-label="Onboarding wird geladen"
                className="size-7 animate-spin text-primary"
              />
            </div>
          )}
          {error && (
            <section className="max-w-xl" role="alert">
              <AlertTriangle className="mb-5 size-10 text-amber-600" />
              <h1 className="text-2xl font-semibold">
                Onboarding nicht verfügbar
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {error}
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Bitte wende dich an People &amp; Culture, damit die fehlende
                Konfiguration ergänzt werden kann.
              </p>
            </section>
          )}
          {context && !context.profile.confirmed && (
            <ProfileStep profile={context.profile} onComplete={reload} />
          )}
          {context?.profile.confirmed && assignedDocuments.length > 0 && (
            <DocumentTasks documents={context.documents} onComplete={reload} />
          )}
          {context?.profile.confirmed && assignedDocuments.length === 0 && (
            <section className="max-w-xl" aria-live="polite">
              <CheckCircle2 className="mb-5 size-10 text-emerald-600" />
              <h1 className="text-2xl font-semibold">
                Onboarding abgeschlossen
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Deine Angaben und Unterlagen sind vollständig. Dein YBase-Zugang
                wird jetzt freigeschaltet.
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function ProgressItem({
  complete,
  current,
  icon: PendingIcon,
  label,
}: {
  complete: boolean;
  current: boolean;
  icon: typeof Circle;
  label: string;
}) {
  const Icon = complete ? CheckCircle2 : current ? PendingIcon : Circle;
  return (
    <li className="flex items-center gap-3 text-sm">
      <Icon
        aria-hidden="true"
        className={
          complete ? "size-5 text-emerald-400" : "size-5 text-background/70"
        }
      />
      <span className={current ? "font-medium" : "text-background/75"}>
        {label}
      </span>
    </li>
  );
}
