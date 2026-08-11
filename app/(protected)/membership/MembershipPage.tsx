"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { declareOwnMembershipResignation } from "@/lib/server/memberships/resignationActions";
import type { OwnMembershipOverview } from "@/lib/server/memberships/selfServiceResignation";
import { MembershipResignationDialog } from "./MembershipResignationDialog";
import { MembershipStatusNotice } from "./MembershipStatusNotice";
import { MembershipSummaryCard } from "./MembershipSummaryCard";

const DATE_FORMAT = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export function MembershipPage({
  membership,
}: {
  membership: OwnMembershipOverview | null;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!membership) {
    return (
      <>
        <PageHeader title="Meine Mitgliedschaft" />
        <Card className="mt-8 max-w-2xl">
          <CardHeader>
            <CardTitle>Keine Mitgliedschaft gefunden</CardTitle>
            <CardDescription>
              Deinem Konto ist aktuell keine Mitgliedschaft zugeordnet.
            </CardDescription>
          </CardHeader>
        </Card>
      </>
    );
  }

  const isResigning =
    membership.legalStatus === "resigning" &&
    membership.scheduledEndReason === "resignation" &&
    membership.scheduledEndAt;
  const guardianPending = membership.requestStatus === "pending_guardian";
  const hasOtherScheduledEnd =
    membership.legalStatus === "resigning" &&
    membership.scheduledEndReason !== "resignation" &&
    membership.scheduledEndAt;

  const submit = () => {
    startTransition(async () => {
      try {
        const result = await declareOwnMembershipResignation();
        setDialogOpen(false);
        if (result.status === "received" && result.emailSent) {
          toast.success(
            "Dein Austritt ist erfasst und wurde dir per E-Mail bestätigt.",
          );
        } else if (result.status === "received") {
          toast.error(
            "Dein Austritt ist erfasst, aber die Bestätigungs-E-Mail konnte nicht gesendet werden.",
          );
        } else if (result.emailSent) {
          toast.success("Die Bestätigung wurde an deine Vertretung gesendet.");
        } else {
          toast.error(
            "Die Anfrage wurde gespeichert, aber die E-Mail konnte nicht gesendet werden.",
          );
        }
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Der Austritt konnte nicht erfasst werden.",
        );
      }
    });
  };

  return (
    <>
      <PageHeader
        title="Meine Mitgliedschaft"
        subtitle="Details und Verwaltung deiner Mitgliedschaft"
      />
      <div className="mt-8 max-w-3xl space-y-6">
        <MembershipSummaryCard membership={membership} />
        <Card>
          <CardHeader>
            <CardTitle>Mitgliedschaft verwalten</CardTitle>
            <CardDescription>
              Austritt und Bestätigungen verwalten
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isResigning ? (
              <div>
                <MembershipStatusNotice
                  title={`Mitgliedschaft endet am ${formatEndDate(isResigning)}`}
                  description="Deine Austrittserklärung ist eingegangen. Bis zum Mitgliedschaftsende bleiben deine Mitgliedschaft und deine Zugänge bestehen."
                />
                {!membership.confirmationEmailSent ? (
                  <Button
                    className="mt-4"
                    variant="outline"
                    disabled={isPending}
                    onClick={submit}
                  >
                    Bestätigung per E-Mail senden
                  </Button>
                ) : null}
              </div>
            ) : hasOtherScheduledEnd ? (
              <MembershipStatusNotice
                title={`Mitgliedschaft endet am ${formatEndDate(hasOtherScheduledEnd)}`}
                description="Das Ende deiner Mitgliedschaft wurde bereits vorgemerkt. Bis dahin bleiben deine Mitgliedschaft und deine Zugänge bestehen."
              />
            ) : guardianPending ? (
              <MembershipStatusNotice
                icon="mail"
                title="Bestätigung durch deine Vertretung ausstehend"
                description={`Wir haben den Bestätigungslink an ${membership.guardianEmail ?? "deine hinterlegte Vertretung"} gesendet.`}
              />
            ) : membership.legalStatus === "active" ? (
              <div className="space-y-4">
                <div>
                  <h2 className="font-semibold">Mitgliedschaft beenden</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Du kannst deinen Austritt direkt über YBase erklären. Das
                    satzungsgemäße Ende wird automatisch berechnet und dir per
                    E-Mail bestätigt.
                  </p>
                </div>
                <Button variant="outline" onClick={() => setDialogOpen(true)}>
                  <LogOut aria-hidden="true" />
                  Austritt erklären
                </Button>
              </div>
            ) : (
              <MembershipStatusNotice
                title="Keine Aktion verfügbar"
                description="Für den aktuellen Status deiner Mitgliedschaft kann hier kein Austritt erfasst werden."
              />
            )}

            {guardianPending ? (
              <Button
                className="mt-4"
                variant="outline"
                disabled={isPending}
                onClick={() => setDialogOpen(true)}
              >
                Bestätigungslink erneut senden
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <MembershipResignationDialog
        membership={membership}
        expectedEndLabel={formatEndDate(membership.expectedEndAt)}
        open={dialogOpen}
        isPending={isPending}
        onOpenChange={setDialogOpen}
        onSubmit={submit}
      />
    </>
  );
}

function formatEndDate(scheduledEndAt: number) {
  return DATE_FORMAT.format(scheduledEndAt - 1);
}
