"use client";

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
import { Loader2 } from "lucide-react";

export function DeleteJobPostingDialog({
  postingTitle,
  open,
  isDeleting,
  onOpenChange,
  onConfirm,
}: {
  postingTitle: string;
  open: boolean;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => !isDeleting && onOpenChange(nextOpen)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ausschreibung löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            „{postingTitle}“ wird zusammen mit dem Tally-Formular, allen
            Bewerbungen und Dateien dauerhaft gelöscht. Das lässt sich nicht
            rückgängig machen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={isDeleting}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : null}
            Endgültig löschen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
