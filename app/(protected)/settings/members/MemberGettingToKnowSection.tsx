"use client";

import { CalendarClock, Loader2, LogOut, UserCheck } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { useMemberMutations } from "@/lib/client/members/hooks/useMemberMutations";
import type { User } from "@/lib/db/types";
import { isGettingToKnowConfirmed } from "@/lib/members/gettingToKnow";

const DATE_FORMAT = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const DAY = 24 * 60 * 60 * 1_000;

function remainingText(endsAt: number): string {
  const days = Math.ceil((endsAt - Date.now()) / DAY);
  if (days < 0) return `Entscheidung überfällig seit ${-days} Tagen`;
  if (days === 0) return "Die Entscheidung ist heute fällig";
  return `Noch ${days} Tage bis zur Entscheidung`;
}

export function MemberGettingToKnowSection({ member }: { member: User }) {
  const { confirmGettingToKnow, endGettingToKnow } = useMemberMutations();
  const [isEndOpen, setIsEndOpen] = useState(false);
  const isPending =
    confirmGettingToKnow.isPending || endGettingToKnow.isPending;
  const endsAt = member.gettingToKnow?.endsAt;
  const isConfirmed = isGettingToKnowConfirmed(member);

  const confirm = async () => {
    try {
      await confirmGettingToKnow.mutateAsync({ userId: member._id });
      toast.success("Vereinsmitgliedschaft angestoßen");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Aktion fehlgeschlagen",
      );
    }
  };

  const end = async () => {
    try {
      await endGettingToKnow.mutateAsync({ userId: member._id });
      setIsEndOpen(false);
      toast.success("Zusammenarbeit beendet");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Aktion fehlgeschlagen",
      );
    }
  };

  return (
    <div className="grid gap-2">
      <Label>Kennenlernphase</Label>
      <div className="flex gap-3 py-1">
        <CalendarClock
          aria-hidden="true"
          className="text-muted-foreground mt-0.5 size-5 shrink-0"
        />
        <div className="grid gap-1 text-sm">
          <p className="font-medium">
            {isConfirmed
              ? "Kennenlernphase bestätigt"
              : endsAt
                ? `Endet am ${DATE_FORMAT.format(endsAt)}`
                : "Laufende Kennenlernphase"}
          </p>
          {isConfirmed ? (
            <p className="text-muted-foreground">
              Wartet auf Satzung und Mitgliedsantrag
            </p>
          ) : endsAt ? (
            <p className="text-muted-foreground">{remainingText(endsAt)}</p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        {!isConfirmed && (
          <Button
            type="button"
            variant="primary"
            disabled={isPending}
            onClick={confirm}
          >
            {confirmGettingToKnow.isPending ? (
              <Loader2 aria-hidden="true" className="animate-spin" />
            ) : (
              <UserCheck aria-hidden="true" className="size-4" />
            )}
            Mitgliedschaft anstoßen
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => setIsEndOpen(true)}
        >
          <LogOut aria-hidden="true" className="size-4" />
          Zusammenarbeit beenden
        </Button>
      </div>

      <Dialog
        open={isEndOpen}
        onOpenChange={(open) => {
          if (!endGettingToKnow.isPending) setIsEndOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Zusammenarbeit beenden?</DialogTitle>
            <DialogDescription>
              Die Person wird archiviert, aus ihren Teams entfernt und ihr
              Zugriff wird gesperrt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={endGettingToKnow.isPending}
              onClick={() => setIsEndOpen(false)}
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={endGettingToKnow.isPending}
              aria-busy={endGettingToKnow.isPending}
              onClick={() => void end()}
            >
              {endGettingToKnow.isPending ? (
                <Loader2 aria-hidden="true" className="animate-spin" />
              ) : null}
              Beenden bestätigen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
