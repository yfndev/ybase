"use client";

import { CalendarClock, Loader2, LogOut } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMemberMutations } from "@/lib/client/members/hooks/useMemberMutations";
import type { User } from "@/lib/db/types";
import { formatBerlinIsoDate, parseBerlinDate } from "@/lib/members/berlinDate";
import { resignationEndAt } from "@/lib/members/legalDates";

const DATE_FORMAT = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function managedStatusDescription(status: User["memberStatus"]): string {
  if (status === "offboarding_planned") {
    return "Der Austritt ist erfasst; die Mitgliedschaft endet nach der satzungsgemäßen Frist.";
  }
  if (status === "offboarding") {
    return "Das Mitglied befindet sich im laufenden Offboarding.";
  }
  if (status === "archived" || status === "offboarded") {
    return "Die Mitgliedschaft wurde beendet und das Profil archiviert.";
  }
  if (status === "excluded") {
    return "Die Mitgliedschaft wurde durch einen Ausschluss beendet.";
  }
  return "Der Status wird durch den formalen Mitgliedschaftsvorgang gesteuert.";
}

export function MemberDepartureSection({ member }: { member: User }) {
  const { recordResignation } = useMemberMutations();
  const [isOpen, setIsOpen] = useState(false);
  const [receivedOn, setReceivedOn] = useState(() =>
    formatBerlinIsoDate(Date.now()),
  );
  const today = formatBerlinIsoDate(Date.now());
  const canRecordResignation =
    member.memberStatus === "onboarding" || member.memberStatus === "active";

  let scheduledEndAt: number | undefined;
  try {
    scheduledEndAt = resignationEndAt(parseBerlinDate(receivedOn));
  } catch {
    scheduledEndAt = undefined;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const result = await recordResignation.mutateAsync({
        userId: member._id,
        receivedOn,
      });
      setIsOpen(false);
      toast.success(
        `Austritt zum ${DATE_FORMAT.format(result.scheduledEndAt - 1)} erfasst`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Der Austritt konnte nicht erfasst werden.",
      );
    }
  };

  return (
    <div className="grid gap-2">
      <Label>Mitgliedsstatus</Label>
      <div className="border-border bg-muted/30 grid gap-3 rounded-md border p-3">
        <p className="text-muted-foreground text-sm">
          {managedStatusDescription(member.memberStatus)}
        </p>
        {canRecordResignation ? (
          <Button
            type="button"
            variant="outline"
            className="w-fit"
            onClick={() => setIsOpen(true)}
          >
            <LogOut aria-hidden="true" className="size-4" />
            Austritt erfassen
          </Button>
        ) : null}
      </div>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!recordResignation.isPending) setIsOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Austritt erfassen</DialogTitle>
            <DialogDescription>
              Erfasse den Eingang der Austrittserklärung von{" "}
              {member.name ?? member.email ?? "diesem Mitglied"}. Das
              satzungsgemäße Mitgliedschaftsende wird automatisch berechnet.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="resignation-received-on">
                Eingang der Austrittserklärung
              </Label>
              <Input
                id="resignation-received-on"
                type="date"
                value={receivedOn}
                max={today}
                required
                autoFocus
                disabled={recordResignation.isPending}
                onChange={(event) => setReceivedOn(event.target.value)}
              />
            </div>

            {scheduledEndAt ? (
              <div className="border-border bg-muted/30 flex gap-3 rounded-md border p-3">
                <CalendarClock
                  aria-hidden="true"
                  className="text-muted-foreground mt-0.5 size-5 shrink-0"
                />
                <div className="grid gap-1 text-sm">
                  <p className="font-medium">
                    Satzungsgemäßes Ende:{" "}
                    {DATE_FORMAT.format(scheduledEndAt - 1)}
                  </p>
                  <p className="text-muted-foreground">
                    Bei Eingang bis einschließlich 30. September endet die
                    Mitgliedschaft mit Ablauf des laufenden Jahres, bei einem
                    späteren Eingang mit Ablauf des Folgejahres. Der Zugriff
                    bleibt bis dahin bestehen.
                  </p>
                </div>
              </div>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={recordResignation.isPending}
                onClick={() => setIsOpen(false)}
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={recordResignation.isPending || !scheduledEndAt}
              >
                {recordResignation.isPending ? (
                  <Loader2 aria-hidden="true" className="animate-spin" />
                ) : null}
                Austritt erfassen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
