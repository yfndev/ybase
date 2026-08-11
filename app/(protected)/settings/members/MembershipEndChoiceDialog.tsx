"use client";

import { ChevronRight, LogOut, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { User } from "@/lib/db/types";

export function MembershipEndChoiceDialog({
  member,
  open,
  onOpenChange,
  onChooseResignation,
  onChooseExclusion,
}: {
  member: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChooseResignation: () => void;
  onChooseExclusion: () => void;
}) {
  const memberName = member.name ?? member.email ?? "dieses Mitglied";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mitgliedschaft beenden</DialogTitle>
          <DialogDescription>
            Wähle den passenden Vorgang für {memberName}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <Button
            type="button"
            variant="outline"
            className="group h-auto w-full justify-start gap-3 whitespace-normal px-4 py-3 text-left hover:bg-muted/50"
            onClick={onChooseResignation}
          >
            <span className="flex size-9 shrink-0 items-center justify-center border bg-muted/50 text-muted-foreground transition-colors group-hover:bg-background group-hover:text-foreground">
              <LogOut aria-hidden="true" className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Austritt erfassen</span>
              <span className="mt-0.5 block text-xs leading-relaxed font-normal text-muted-foreground">
                Eine eingegangene Austrittserklärung mit Datum dokumentieren.
              </span>
            </span>
            <ChevronRight
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
            />
          </Button>
          <Button
            type="button"
            variant="outline"
            className="group h-auto w-full justify-start gap-3 whitespace-normal px-4 py-3 text-left hover:border-destructive/40 hover:bg-destructive/5"
            onClick={onChooseExclusion}
          >
            <span className="flex size-9 shrink-0 items-center justify-center border border-destructive/20 bg-destructive/5 text-destructive transition-colors group-hover:bg-destructive/10">
              <UserMinus aria-hidden="true" className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Mitglied ausschließen</span>
              <span className="mt-0.5 block text-xs leading-relaxed font-normal text-muted-foreground">
                Einen bereits beschlossenen Ausschluss sofort umsetzen.
              </span>
            </span>
            <ChevronRight
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-destructive"
            />
          </Button>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Abbrechen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
