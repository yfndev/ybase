"use client";

import { Loader2 } from "lucide-react";
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
  dialog: RejectDialog;
  onChange: (dialog: RejectDialog) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
};

export function ReviewDialog({
  dialog,
  onChange,
  onSubmit,
  isSubmitting,
}: Props) {
  const requestsChanges = dialog.action === "changes";
  return (
    <Dialog
      open={dialog.open}
      onOpenChange={(open) => onChange({ ...dialog, open })}
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
          value={dialog.note}
          onChange={(event) =>
            onChange({ ...dialog, note: event.target.value })
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
            disabled={isSubmitting}
            onClick={() => onChange({ ...dialog, open: false })}
          >
            Abbrechen
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || !dialog.note.trim()}
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {requestsChanges ? "Änderungen anfordern" : "Ablehnen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
