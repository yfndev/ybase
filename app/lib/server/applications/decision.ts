"use server";

import { assertApplicationAdmissionReady } from "../../applications/admissionEligibility";
import type { ApplicationDecision } from "../../applications/decisionEmail";
import { isApplicationStatusTransitionAllowed } from "../../applications/transitions";
import { jobPostings } from "../../db/collections";
import type { Application } from "../../db/types";
import { sendUserStateEmail } from "../users/email";
import { loadOwnedApplication } from "./access";
import { recordDecisionLogs } from "./decisionAudit";
import { prepareAcceptance, sendDecisionEmail } from "./decisionDelivery";
import {
  applicationDecisionInputSchema,
  type ApplicationDecisionInput,
} from "./decisionInput";
import { persistDecision } from "./decisionPersistence";
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
    if (acceptedMember) {
      await sendUserStateEmail({
        user: acceptedMember.member,
        event: "team_onboarding_started",
      });
    }
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
