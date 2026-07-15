"use client";

import { Button } from "@/components/ui/button";
import { SheetFooter } from "@/components/ui/sheet";
import { useApplicationMutations } from "@/lib/client/applications/hooks/useApplicationMutations";
import {
  applicationDecisionEmailDefaults,
  type ApplicationDecision,
} from "@/lib/applications/decisionEmail";
import {
  type ApplicationNextStatus,
  APPLICATION_STATUS_TRANSITIONS,
} from "@/lib/applications/transitions";
import type { ApplicationStatus } from "@/lib/db/types";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  ApplicationDecisionDialog,
  type ApplicationDecisionDraft,
} from "./ApplicationDecisionDialog";

interface StatusAction {
  status: ApplicationStatus;
  label: string;
  variant?: "outline" | "destructive";
}

const STATUS_ACTIONS: Record<ApplicationNextStatus, StatusAction> = {
  review: { status: "review", label: "In Prüfung nehmen" },
  interview: { status: "interview", label: "Zum Interview" },
  accepted: { status: "accepted", label: "Annehmen" },
  rejected: { status: "rejected", label: "Ablehnen", variant: "destructive" },
};

export function ApplicationActionFooter({
  applicationId,
  status,
  applicantName,
  jobPostingTitle,
}: {
  applicationId: string;
  status: ApplicationStatus;
  applicantName?: string;
  jobPostingTitle: string;
}) {
  const { setStatus, sendDecision } = useApplicationMutations();
  const [decisionDraft, setDecisionDraft] =
    useState<ApplicationDecisionDraft | null>(null);
  const actions = APPLICATION_STATUS_TRANSITIONS[status].map(
    (nextStatus) => STATUS_ACTIONS[nextStatus],
  );

  async function changeStatus(nextStatus: ApplicationStatus) {
    if (nextStatus === "accepted" || nextStatus === "rejected") {
      openDecision(nextStatus);
      return;
    }
    try {
      await setStatus.mutateAsync({ applicationId, status: nextStatus });
      toast.success("Status aktualisiert");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Status konnte nicht geändert werden",
      );
    }
  }

  function openDecision(decision: ApplicationDecision) {
    setDecisionDraft({
      decision,
      ...applicationDecisionEmailDefaults({
        decision,
        applicantName,
        jobTitle: jobPostingTitle,
      }),
    });
  }

  async function submitDecision() {
    if (!decisionDraft) return;
    try {
      await sendDecision.mutateAsync({ applicationId, ...decisionDraft });
      toast.success(
        decisionDraft.decision === "accepted"
          ? "Zusage versendet"
          : "Absage versendet",
      );
      setDecisionDraft(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "E-Mail konnte nicht versendet werden",
      );
    }
  }

  return (
    <>
      <SheetFooter className="border-t bg-background">
        {actions.length > 0 ? (
          <fieldset
            className="flex flex-wrap gap-2"
            aria-label="Bewerbungsaktionen"
          >
            {actions.map((action) => (
              <Button
                key={action.status}
                variant={action.variant ?? "primary"}
                disabled={setStatus.isPending || sendDecision.isPending}
                onClick={() => changeStatus(action.status)}
              >
                {action.label}
              </Button>
            ))}
          </fieldset>
        ) : (
          <p className="text-sm text-muted-foreground">
            Für diese abgeschlossene Bewerbung sind keine weiteren Statuswechsel
            verfügbar.
          </p>
        )}
      </SheetFooter>
      <ApplicationDecisionDialog
        draft={decisionDraft}
        isSending={sendDecision.isPending}
        onChange={setDecisionDraft}
        onClose={() => setDecisionDraft(null)}
        onSubmit={submitDecision}
      />
    </>
  );
}
