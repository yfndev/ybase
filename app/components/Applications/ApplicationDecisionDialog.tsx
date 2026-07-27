"use client";

import { Loader2, Lock, Unlock } from "lucide-react";
import { useState } from "react";
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

type DecisionMessage = { subject: string; message: string };

export type ApplicationDecisionDraft =
  | (DecisionMessage & {
      decision: Extract<ApplicationDecision, "accepted">;
      yfnEmail: string;
    })
  | (DecisionMessage & {
      decision: Extract<ApplicationDecision, "rejected">;
    });

interface Props {
  draft: ApplicationDecisionDraft | null;
  isSending: boolean;
  onChange: (draft: ApplicationDecisionDraft) => void;
  onClose: () => void;
  onSubmit: () => void;
}

type AcceptedDraft = Extract<
  ApplicationDecisionDraft,
  { decision: "accepted" }
>;

function WorkspaceEmailField({
  draft,
  isSending,
  onChange,
}: {
  draft: AcceptedDraft;
  isSending: boolean;
  onChange: (draft: ApplicationDecisionDraft) => void;
}) {
  const [isUnlocked, setIsUnlocked] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor="application-decision-yfn-email">Neue YFN-E-Mail</Label>
      <div className="flex gap-2">
        <Input
          id="application-decision-yfn-email"
          type="email"
          autoComplete="off"
          value={draft.yfnEmail}
          maxLength={320}
          disabled={isSending || !isUnlocked}
          onChange={(event) =>
            onChange({ ...draft, yfnEmail: event.target.value })
          }
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-auto"
          disabled={isSending}
          aria-label={
            isUnlocked ? "YFN-E-Mail sperren" : "YFN-E-Mail bearbeiten"
          }
          onClick={() => setIsUnlocked((value) => !value)}
        >
          {isUnlocked ? (
            <Lock className="size-5" aria-hidden="true" />
          ) : (
            <Unlock className="size-5" aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  );
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
            {accepts ? "Zusage senden" : "Absage versenden"}
          </DialogTitle>
          <DialogDescription className={accepts ? "sr-only" : undefined}>
            {accepts
              ? "Zusage mit neuer YFN-E-Mail senden."
              : "Prüfe Betreff und Nachricht. Der Status ändert sich erst nach dem Versand."}
          </DialogDescription>
        </DialogHeader>
        {draft ? (
          <div className="space-y-4">
            {draft.decision === "accepted" ? (
              <WorkspaceEmailField
                draft={draft}
                isSending={isSending}
                onChange={onChange}
              />
            ) : null}
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
          <Button
            size="member"
            variant="outline"
            disabled={isSending}
            onClick={onClose}
          >
            Abbrechen
          </Button>
          <Button
            variant={accepts ? "primary" : "destructive"}
            size="member"
            disabled={
              isSending ||
              !draft?.subject.trim() ||
              !draft.message.trim() ||
              (draft?.decision === "accepted" && !draft.yfnEmail.trim())
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
