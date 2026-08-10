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

export function ExcludeMemberDialog({
  member,
  open,
  isPending,
  isRetry,
  onOpenChange,
  onConfirm,
}: {
  member: User;
  open: boolean;
  isPending: boolean;
  isRetry: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const memberName = member.name ?? member.email ?? "dieses Mitglied";

  return (
    <AlertDialog
      open={open}
      onOpenChange={(value) => !isPending && onOpenChange(value)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isRetry
              ? "Ausschluss technisch abschließen?"
              : "Mitglied endgültig ausschließen?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            {isRetry ? (
              <span className="block">
                Die Vereinsmitgliedschaft von {memberName} ist bereits beendet.
                Die ausstehende Schließung der Zugänge wird erneut ausgeführt.
              </span>
            ) : (
              <>
                <span className="block">
                  Damit bestätigst du, dass der Ausschluss von {memberName}
                  bereits satzungsgemäß beschlossen wurde.
                </span>
                <span className="block">
                  Die Vereinsmitgliedschaft wird sofort beendet. Teamzuordnungen
                  und Berechtigungen werden entfernt und sämtliche Zugänge
                  geschlossen.
                </span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            disabled={isPending}
            aria-busy={isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isPending ? (
              <Loader2 aria-hidden="true" className="animate-spin" />
            ) : null}
            {isRetry ? "Ausschluss abschließen" : "Mitglied ausschließen"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
