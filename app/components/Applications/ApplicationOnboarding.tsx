"use client";

import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApplicationMutations } from "@/lib/client/applications/hooks/useApplicationMutations";
import type { ApplicationWithFiles } from "@/lib/db/types";
import { DATE_TIME_FORMAT } from "./applicationPresentation";

export function ApplicationOnboarding({
  application,
}: {
  application: ApplicationWithFiles;
}) {
  const { setYfnEmail: saveYfnEmailMutation, setOnboardingCompleted } =
    useApplicationMutations();
  const [yfnEmail, setYfnEmail] = useState(application.yfnEmail ?? "");
  const linked = Boolean(application.onboardingUserId);
  const workspaceProvisioned = Boolean(application.workspaceProvisionedAt);
  const onboardingCompleted = Boolean(application.onboardingCompletedAt);

  async function saveYfnEmail() {
    try {
      await saveYfnEmailMutation.mutateAsync({
        applicationId: application._id,
        yfnEmail,
      });
      toast.success("YFN-E-Mail gespeichert");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Speichern",
      );
    }
  }

  async function updateOnboarding(completed: boolean) {
    try {
      await setOnboardingCompleted.mutateAsync({
        applicationId: application._id,
        completed,
      });
      toast.success(
        completed ? "Onboarding beendet" : "Onboarding wieder geöffnet",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Speichern",
      );
    }
  }

  return (
    <section className="space-y-4 border-t pt-5">
      <h3 className="text-xl font-semibold">Onboarding</h3>

      {application.onboardingLinkError ? (
        <div
          className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{application.onboardingLinkError}</span>
        </div>
      ) : null}

      {linked ? (
        <div className="flex gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            Profil verknüpft
            {application.onboardingLinkedAt
              ? ` am ${DATE_TIME_FORMAT.format(application.onboardingLinkedAt)}`
              : ""}
            . Die Bewerbungsdaten sind zur Bereinigung vorgemerkt.
          </span>
        </div>
      ) : null}

      {workspaceProvisioned ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CircleCheck
            className="size-4 shrink-0 text-emerald-600"
            aria-hidden="true"
          />
          <span>Google-Konto erstellt</span>
        </div>
      ) : null}

      <div className="grid gap-1.5">
        <Label htmlFor="application-yfn-email">YFN-E-Mail</Label>
        <Input
          id="application-yfn-email"
          type="email"
          autoComplete="off"
          value={yfnEmail}
          onChange={(event) => setYfnEmail(event.target.value)}
          placeholder="vorname.nachname@youngfounders.network"
          disabled={linked || workspaceProvisioned}
          aria-describedby="application-yfn-email-help"
        />
        <p
          id="application-yfn-email-help"
          className="text-xs text-muted-foreground"
        >
          {workspaceProvisioned
            ? "Diese Adresse gehört zum automatisch erstellten Workspace-Konto."
            : "Muss der Organisations-Domain entsprechen und eindeutig sein."}
        </p>
      </div>

      {!linked && !workspaceProvisioned ? (
        <Button
          size="member"
          onClick={saveYfnEmail}
          disabled={saveYfnEmailMutation.isPending || !yfnEmail.trim()}
        >
          {saveYfnEmailMutation.isPending ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : null}
          YFN-E-Mail speichern
        </Button>
      ) : null}

      <div className="flex items-start gap-3 border-t pt-4">
        <Checkbox
          id="application-onboarding"
          checked={onboardingCompleted}
          disabled={
            setOnboardingCompleted.isPending ||
            (!application.yfnEmail && !onboardingCompleted)
          }
          onCheckedChange={(checked) => void updateOnboarding(checked === true)}
        />
        <div className="min-w-0 space-y-1">
          <Label
            htmlFor="application-onboarding"
            className="text-base leading-6"
          >
            Onboarding beendet
          </Label>
          <p className="text-sm leading-5 text-muted-foreground">
            Alle Zugänge sind eingerichtet, die YFN-E-Mail ist gespeichert und
            das interne Onboarding wurde durchgeführt.
          </p>
          {application.onboardingCompletedAt ? (
            <p className="text-xs text-muted-foreground">
              Abgeschlossen am{" "}
              {DATE_TIME_FORMAT.format(application.onboardingCompletedAt)}
            </p>
          ) : !application.yfnEmail ? (
            <p className="text-xs text-muted-foreground">
              Speichere zuerst die eingerichtete YFN-E-Mail.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
