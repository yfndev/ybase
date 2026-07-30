"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { useMemberMutations } from "@/lib/client/members/hooks/useMemberMutations";
import type { User } from "@/lib/db/types";
import { Flag, Loader2, ShieldAlert } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

const MAX_INFRACTIONS = 2;

export function MemberInfractionsSection({ member }: { member: User }) {
  const { recordInfraction } = useMemberMutations();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const infractions = member.memberInfractions ?? [];
  const isSecondInfraction = infractions.length === MAX_INFRACTIONS - 1;
  const canRecord =
    (member.memberStatus === "active" ||
      member.memberStatus === "offboarding_planned") &&
    infractions.length < MAX_INFRACTIONS;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const result = await recordInfraction.mutateAsync({
        userId: member._id,
        reason,
      });
      setReason("");
      setIsOpen(false);
      toast.success(
        result.memberExcluded
          ? "Mitglied ausgeschlossen"
          : "Verstoß gespeichert",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Der Verstoß konnte nicht gespeichert werden.",
      );
    }
  };

  return (
    <div className="grid gap-2">
      {infractions.length > 0 ? (
        <section aria-label="Hinterlegte Verstöße">
          <ol className="grid gap-2">
            {infractions.map((infraction, index) => (
              <li
                key={infraction._id}
                className="border-l-secondary bg-secondary/[0.06] border-l-4 px-4 py-3"
              >
                <p className="text-sm font-semibold">
                  {infractions.length > 1 ? `Verstoß ${index + 1}` : "Verstoß"}
                </p>
                <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">
                  {infraction.reason}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {canRecord ? (
        <Button
          type="button"
          variant="ghost"
          className="w-fit px-2"
          onClick={() => setIsOpen(true)}
        >
          <Flag
            aria-hidden="true"
            className="size-5 stroke-[2.5] text-secondary"
          />
          Verstoß melden
        </Button>
      ) : null}

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!recordInfraction.isPending) setIsOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isSecondInfraction
                ? "Zweiten Verstoß bestätigen"
                : "Verstoß melden"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Angaben zum Verstoß
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            {isSecondInfraction ? (
              <div className="border-destructive/30 bg-destructive/5 text-destructive flex gap-3 border p-3 text-sm">
                <ShieldAlert className="mt-0.5 size-5 shrink-0" />
                <p>
                  Dies ist der zweite Verstoß. Nach dem Speichern wird das
                  Mitglied sofort ausgeschlossen und der Zugriff gesperrt.
                </p>
              </div>
            ) : null}

            <div>
              <Label htmlFor="member-infraction-reason">Beschreibung</Label>
              <Textarea
                id="member-infraction-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Was ist wann und in welchem Zusammenhang passiert?"
                minLength={3}
                maxLength={1_000}
                rows={5}
                required
                autoFocus
                disabled={recordInfraction.isPending}
              />
              <p className="text-muted-foreground mt-1 text-right text-xs">
                {reason.length} / 1.000
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={recordInfraction.isPending}
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                variant={isSecondInfraction ? "destructive" : "primary"}
                disabled={
                  recordInfraction.isPending || reason.trim().length < 3
                }
              >
                {recordInfraction.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : null}
                {isSecondInfraction
                  ? "Verstoß & Ausschluss bestätigen"
                  : "Verstoß melden"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
