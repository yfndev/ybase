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
import type { RejectDialog } from "./types";

type Props = {
  rejectDialog: RejectDialog;
  onRejectDialogChange: (dialog: RejectDialog) => void;
  onReject: () => void;
};

export function RejectDialogModal({
  rejectDialog,
  onRejectDialogChange,
  onReject,
}: Props) {
  return (
    <Dialog
      open={rejectDialog.open}
      onOpenChange={(open) => onRejectDialogChange({ ...rejectDialog, open })}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ablehnen</DialogTitle>
          <DialogDescription>
            Bitte gib einen Grund für die Ablehnung ein.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={rejectDialog.note}
          onChange={(e) =>
            onRejectDialogChange({ ...rejectDialog, note: e.target.value })
          }
          placeholder="Grund für die Ablehnung..."
          rows={4}
        />
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() =>
              onRejectDialogChange({ ...rejectDialog, open: false })
            }
          >
            Abbrechen
          </Button>
          <Button onClick={onReject} disabled={!rejectDialog.note}>
            Ablehnen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
