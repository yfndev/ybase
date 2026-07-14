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

type Props = {
  count: number;
  singleItemLabel?: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteReimbursementsDialog({
  count,
  singleItemLabel,
  isDeleting,
  onCancel,
  onConfirm,
}: Props) {
  const isSingleItem = count === 1;
  const title = isSingleItem
    ? `${singleItemLabel ?? "Erstattung"} löschen?`
    : "Ausgewählte Erstattungen löschen?";

  return (
    <AlertDialog
      open={count > 0}
      onOpenChange={(open) => !open && !isDeleting && onCancel()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {isSingleItem
              ? "Die Erstattung und alle zugehörigen Dateien werden dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden."
              : "Die ausgewählten Erstattungen und alle zugehörigen Dateien werden dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden."}
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
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : null}
            Löschen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
