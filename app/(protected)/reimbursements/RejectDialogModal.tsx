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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import type { RejectDialog } from "./types";

type Props = {
  rejectDialog: RejectDialog;
  onRejectDialogChange: (dialog: RejectDialog) => void;
  onReject: () => void;
  isRejecting: boolean;
};

export function RejectDialogModal({
  rejectDialog,
  onRejectDialogChange,
  onReject,
  isRejecting,
}: Props) {
  const requestsChanges = rejectDialog.action === "changes";

  return (
    <Dialog
      open={rejectDialog.open}
      onOpenChange={(open) => onRejectDialogChange({ ...rejectDialog, open })}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {requestsChanges ? "Änderungen anfordern" : "Endgültig ablehnen"}
          </DialogTitle>
          <DialogDescription>
            {requestsChanges
              ? "Beschreibe, was vor der Genehmigung geändert werden muss."
              : "Bitte gib einen Grund für die endgültige Ablehnung ein."}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={rejectDialog.note}
          onChange={(e) =>
            onRejectDialogChange({ ...rejectDialog, note: e.target.value })
          }
          placeholder={
            requestsChanges
              ? "Benötigte Änderungen..."
              : "Grund für die Ablehnung..."
          }
          rows={4}
        />
        <DialogFooter>
          <Button
            variant="outline"
            disabled={isRejecting}
            onClick={() =>
              onRejectDialogChange({ ...rejectDialog, open: false })
            }
          >
            Abbrechen
          </Button>
          <Button
            onClick={onReject}
            disabled={isRejecting || !rejectDialog.note.trim()}
          >
            {isRejecting && <Loader2 className="size-4 animate-spin" />}
            {requestsChanges ? "Änderungen anfordern" : "Ablehnen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
