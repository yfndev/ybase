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
            Ablehnen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
