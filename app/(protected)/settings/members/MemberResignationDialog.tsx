"use client";

import { CalendarClock, Loader2 } from "lucide-react";
import { useState } from "react";
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
import type { User } from "@/lib/db/types";
import { formatBerlinIsoDate, parseBerlinDate } from "@/lib/members/berlinDate";
import { resignationEndAt } from "@/lib/members/legalDates";

const DATE_FORMAT = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function MemberResignationDialog({
  member,
  open,
  isPending,
  onOpenChange,
  onSubmit,
}: {
  member: User;
  open: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (receivedOn: string) => Promise<void>;
}) {
  const [receivedOn, setReceivedOn] = useState(() =>
    formatBerlinIsoDate(Date.now()),
  );
  const today = formatBerlinIsoDate(Date.now());

  let scheduledEndAt: number | undefined;
  try {
    scheduledEndAt = resignationEndAt(parseBerlinDate(receivedOn));
  } catch {
    scheduledEndAt = undefined;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => !isPending && onOpenChange(value)}
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

        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit(receivedOn);
          }}
        >
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
              disabled={isPending}
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
                  Satzungsgemäßes Ende: {DATE_FORMAT.format(scheduledEndAt - 1)}
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
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isPending || !scheduledEndAt}
              aria-busy={isPending}
            >
              {isPending ? (
                <Loader2 aria-hidden="true" className="animate-spin" />
              ) : null}
              Austritt erfassen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
