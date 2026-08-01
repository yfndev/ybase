"use server";

import { APPLICATION_STATUS_LABELS } from "../../applications/status";
import { assertApplicationAdmissionReady } from "../../applications/admissionEligibility";
import type { ApplicationDecision } from "../../applications/decisionEmail";
import { isApplicationStatusTransitionAllowed } from "../../applications/transitions";
import { applications, jobPostings } from "../../db/collections";
import type { Application } from "../../db/types";
import { loadOwnedApplication } from "./access";
import { recordDecisionLogs } from "./decisionAudit";
import { prepareAcceptance, sendDecisionEmail } from "./decisionDelivery";
import {
  applicationDecisionInputSchema,
  type ApplicationDecisionInput,
  type ParsedApplicationDecision,
} from "./decisionInput";
import { createApplicationHistoryEntry } from "./history";
import {
  createAcceptedApplicantMember,
  rollbackAcceptedApplicantMember,
} from "./memberProvisioning";

export async function sendApplicationDecision(
  input: ApplicationDecisionInput,
): Promise<void> {
  const decision = applicationDecisionInputSchema.parse(input);
  const { user, application } = await loadOwnedApplication(
    decision.applicationId,
  );
  assertDecisionAllowed(application, decision.decision);

  const posting = await (
    await jobPostings()
  ).findOne({
    _id: application.jobPostingId,
    organizationId: user.organizationId,
  });
  if (!posting) throw new Error("Ausschreibung nicht gefunden");

  const prepared =
    decision.decision === "accepted"
      ? await prepareAcceptance({
          application,
          organizationId: user.organizationId,
          message: decision.message,
          yfnEmail: decision.yfnEmail,
        })
      : {
          message: decision.message,
          workspaceAccess: undefined,
          workspaceUserId: undefined,
        };

  let acceptedMember:
    | Awaited<ReturnType<typeof createAcceptedApplicantMember>>
    | undefined;
  if (decision.decision === "accepted") {
    if (!prepared.workspaceUserId) {
      throw new Error("Workspace-Mitglied konnte nicht angelegt werden");
    }
    acceptedMember = await createAcceptedApplicantMember({
      application,
      email: decision.yfnEmail,
      googleWorkspaceUserId: prepared.workspaceUserId,
      organizationId: user.organizationId,
      teamId: posting.teamId,
    });
  }

  let statusDetails: string;
  try {
    await sendDecisionEmail({
      application,
      decision: decision.decision,
      jobTitle: posting.title,
      message: prepared.message,
      organizationId: user.organizationId,
      subject: decision.subject,
      workspaceUserId: prepared.workspaceUserId,
      workspaceAccess: prepared.workspaceAccess,
    });
    statusDetails = await persistDecision({
      application,
      decision,
      userId: user._id,
      organizationId: user.organizationId,
      workspaceUserId: prepared.workspaceUserId,
      onboardingUserId: acceptedMember?.member._id,
    });
  } catch (error) {
    if (acceptedMember?.isCreated) {
      try {
        await rollbackAcceptedApplicantMember(
          application._id,
          acceptedMember.member._id,
          user.organizationId,
        );
      } catch (rollbackError) {
        console.error("accepted member rollback failed", rollbackError);
      }
    }
    throw error;
  }

  await recordDecisionLogs({
    application,
    decision,
    organizationId: user.organizationId,
    statusDetails,
    userId: user._id,
    workspaceUserId: prepared.workspaceUserId,
    onboardingUserId: acceptedMember?.member._id,
  });
}

function assertDecisionAllowed(
  application: Application,
  decision: ApplicationDecision,
): void {
  if (!isApplicationStatusTransitionAllowed(application.status, decision)) {
    throw new Error("Dieser Statuswechsel ist nicht zulässig");
  }
  if (decision === "accepted") {
    assertApplicationAdmissionReady(application, Date.now());
  }
  const isProvisioning =
    application.workspaceProvisioningStatus === "pending" ||
    application.workspaceProvisioningStatus === "provisioned";
  if (decision === "rejected" && isProvisioning) {
    throw new Error("Das Workspace-Konto wird bereits eingerichtet");
  }
}

async function persistDecision(input: {
  application: Application;
  decision: ParsedApplicationDecision;
  organizationId: string;
  userId: string;
  workspaceUserId?: string;
  onboardingUserId?: string;
}): Promise<string> {
  const entry = createApplicationHistoryEntry(
    input.userId,
    "status_changed",
    `${APPLICATION_STATUS_LABELS[input.application.status]} → ${APPLICATION_STATUS_LABELS[input.decision.decision]}`,
    {
      fromStatus: input.application.status,
      toStatus: input.decision.decision,
    },
  );
  const result = await (
    await applications()
  ).updateOne(
    {
      _id: input.application._id,
      organizationId: input.organizationId,
      status: input.application.status,
      ...(input.workspaceUserId
        ? { workspaceProvisioningStatus: "provisioned" }
        : {}),
      ...(input.onboardingUserId
        ? {
            $or: [
              { onboardingUserId: { $exists: false } },
              { onboardingUserId: input.onboardingUserId },
            ],
          }
        : {}),
    },
    {
      $set: {
        status: input.decision.decision,
        updatedAt: entry.timestamp,
        ...(input.workspaceUserId
          ? { workspaceProvisioningStatus: "invited" as const }
          : {}),
        ...(input.onboardingUserId
          ? {
              onboardingUserId: input.onboardingUserId,
              onboardingLinkedAt: entry.timestamp,
              cleanupEligibleAt: entry.timestamp,
            }
          : {}),
      },
      ...(input.workspaceUserId || input.onboardingUserId
        ? {
            $unset: {
              ...(input.workspaceUserId
                ? { workspaceProvisioningError: "" }
                : {}),
              ...(input.onboardingUserId ? { onboardingLinkError: "" } : {}),
            },
          }
        : {}),
      $push: { history: entry },
    },
  );
  if (result.modifiedCount !== 1) {
    throw new Error("Bewerbung wurde zwischenzeitlich geändert");
  }

  return entry.details;
}
