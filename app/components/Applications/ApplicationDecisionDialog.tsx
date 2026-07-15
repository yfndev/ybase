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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ApplicationDecision } from "@/lib/applications/decisionEmail";
import { Loader2 } from "lucide-react";

export interface ApplicationDecisionDraft {
  decision: ApplicationDecision;
  subject: string;
  message: string;
}

interface Props {
  draft: ApplicationDecisionDraft | null;
  isSending: boolean;
  onChange: (draft: ApplicationDecisionDraft) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function ApplicationDecisionDialog({
  draft,
  isSending,
  onChange,
  onClose,
  onSubmit,
}: Props) {
  const accepts = draft?.decision === "accepted";

  return (
    <Dialog open={draft !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {accepts ? "Zusage versenden" : "Absage versenden"}
          </DialogTitle>
          <DialogDescription>
            Prüfe Betreff und Nachricht. Der Status ändert sich erst, wenn Brevo
            den Versand bestätigt hat.
          </DialogDescription>
        </DialogHeader>
        {draft ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="application-decision-subject">Betreff</Label>
              <Input
                id="application-decision-subject"
                value={draft.subject}
                maxLength={200}
                disabled={isSending}
                onChange={(event) =>
                  onChange({ ...draft, subject: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="application-decision-message">Nachricht</Label>
              <Textarea
                id="application-decision-message"
                value={draft.message}
                rows={9}
                maxLength={10_000}
                disabled={isSending}
                onChange={(event) =>
                  onChange({ ...draft, message: event.target.value })
                }
              />
            </div>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" disabled={isSending} onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            variant={accepts ? "primary" : "destructive"}
            disabled={
              isSending || !draft?.subject.trim() || !draft.message.trim()
            }
            onClick={onSubmit}
          >
            {isSending ? <Loader2 className="animate-spin" /> : null}
            {accepts ? "Zusage senden" : "Absage senden"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
