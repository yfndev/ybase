"use client";

import { LogOut, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
            Erfasse den freiwilligen Austritt von {memberName} oder setze einen
            bereits beschlossenen Ausschluss um.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Button
            type="button"
            variant="outline"
            className="justify-start"
            onClick={onChooseResignation}
          >
            <LogOut aria-hidden="true" />
            Austritt erfassen
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="justify-start"
            onClick={onChooseExclusion}
          >
            <UserMinus aria-hidden="true" />
            Mitglied ausschließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
