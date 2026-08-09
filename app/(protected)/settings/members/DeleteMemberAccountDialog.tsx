"use client";

import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { User } from "@/lib/db/types";

export function DeleteMemberAccountDialog({
  member,
  open,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  member: User;
  open: boolean;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const memberName = member.name ?? member.email ?? "dieses Mitglied";

  return (
    <AlertDialog open={open} onOpenChange={(value) => !value && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Workspace-Konto löschen?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              Das Google Workspace-Konto von {memberName} wird dauerhaft
              gelöscht. Die Person verliert den Zugriff auf Google Workspace und
              YBase.
            </span>
            <span className="block">
              Die Mitgliedschaftsakte und das Profil in YBase bleiben für die
              Dokumentation erhalten. Diese Aktion kann nicht rückgängig gemacht
              werden.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            aria-busy={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isDeleting ? (
              <Loader2 aria-hidden="true" className="animate-spin" />
            ) : null}
            Account endgültig löschen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
