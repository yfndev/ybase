"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  type ApplicationDecision,
  applicationDecisionEmailDefaults,
} from "@/lib/applications/decisionEmail";
import {
  APPLICATION_STATUS_TRANSITIONS,
  type ApplicationNextStatus,
} from "@/lib/applications/transitions";
import { suggestYfnEmail } from "@/lib/applications/yfnEmail";
import { useApplicationMutations } from "@/lib/client/applications/hooks/useApplicationMutations";
import type { ApplicationStatus } from "@/lib/db/types";
import {
  ApplicationDecisionDialog,
  type ApplicationDecisionDraft,
} from "./ApplicationDecisionDialog";

interface StatusAction {
  status: ApplicationStatus;
  label: string;
  variant?: "outline";
}

const STATUS_ACTIONS: Partial<Record<ApplicationNextStatus, StatusAction>> = {
  interview: { status: "interview", label: "Zum Interview eingeladen" },
  accepted: { status: "accepted", label: "Annehmen" },
  rejected: { status: "rejected", label: "Ablehnen", variant: "outline" },
};

export function ApplicationActionFooter({
  applicationId,
  status,
  applicantName,
  jobPostingTitle,
  organizationDomain,
  yfnEmail,
  acceptanceBlockedReason,
}: {
  applicationId: string;
  status: ApplicationStatus;
  applicantName?: string;
  jobPostingTitle: string;
  organizationDomain: string;
  yfnEmail?: string;
  acceptanceBlockedReason?: string;
}) {
  const { setStatus, sendDecision } = useApplicationMutations();
  const [decisionDraft, setDecisionDraft] =
    useState<ApplicationDecisionDraft | null>(null);
  const actions = APPLICATION_STATUS_TRANSITIONS[status].flatMap(
    (nextStatus) => {
      const action = STATUS_ACTIONS[nextStatus];
      return action ? [action] : [];
    },
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
    const email = applicationDecisionEmailDefaults({
      decision,
      applicantName,
      jobTitle: jobPostingTitle,
    });
    if (decision === "accepted") {
      setDecisionDraft({
        decision,
        ...email,
        yfnEmail:
          yfnEmail ?? suggestYfnEmail(applicantName, organizationDomain),
      });
      return;
    }
    setDecisionDraft({ decision, ...email });
  }

  async function submitDecision() {
    if (!decisionDraft) return;
    try {
      await sendDecision.mutateAsync({ applicationId, ...decisionDraft });
      toast.success(
        decisionDraft.decision === "accepted"
          ? "Zusage versendet · Onboarding gestartet"
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
      {actions.length > 0 ? (
        <section className="border-t pt-5">
          <fieldset className="space-y-2" aria-label="Bewerbungsaktionen">
            {acceptanceBlockedReason &&
            actions.some(
              ({ status: nextStatus }) => nextStatus === "accepted",
            ) ? (
              <p className="text-sm text-destructive">
                {acceptanceBlockedReason}
              </p>
            ) : null}
            {actions.map((action, index) => (
              <Button
                key={action.status}
                className="w-full"
                size="member"
                variant={
                  action.variant ?? (index === 0 ? "primary" : "outline")
                }
                disabled={
                  setStatus.isPending ||
                  sendDecision.isPending ||
                  (action.status === "accepted" &&
                    Boolean(acceptanceBlockedReason))
                }
                onClick={() => changeStatus(action.status)}
              >
                {action.label}
              </Button>
            ))}
          </fieldset>
        </section>
      ) : null}
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
