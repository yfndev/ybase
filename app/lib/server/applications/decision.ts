"use server";

import { APPLICATION_STATUS_LABELS } from "../../applications/status";
import type { ApplicationDecision } from "../../applications/decisionEmail";
import { isApplicationStatusTransitionAllowed } from "../../applications/transitions";
import { applications, jobPostings } from "../../db/collections";
import type { Application } from "../../db/types";
import { addLog } from "../logs";
import { loadOwnedApplication } from "./access";
import { prepareAcceptance, sendDecisionEmail } from "./decisionDelivery";
import {
  applicationDecisionInputSchema,
  type ApplicationDecisionInput,
  type ParsedApplicationDecision,
} from "./decisionInput";
import { createApplicationHistoryEntry } from "./history";

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
      : { message: decision.message, workspaceUserId: undefined };

  await sendDecisionEmail({
    application,
    decision: decision.decision,
    jobTitle: posting.title,
    message: prepared.message,
    organizationId: user.organizationId,
    subject: decision.subject,
    workspaceUserId: prepared.workspaceUserId,
  });
  await persistDecision({
    application,
    decision,
    userId: user._id,
    organizationId: user.organizationId,
    workspaceUserId: prepared.workspaceUserId,
  });
}

function assertDecisionAllowed(
  application: Application,
  decision: ApplicationDecision,
): void {
  if (!isApplicationStatusTransitionAllowed(application.status, decision)) {
    throw new Error("Dieser Statuswechsel ist nicht zulässig");
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
}): Promise<void> {
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
    },
    {
      $set: {
        status: input.decision.decision,
        updatedAt: entry.timestamp,
        ...(input.workspaceUserId
          ? { workspaceProvisioningStatus: "invited" as const }
          : {}),
      },
      ...(input.workspaceUserId
        ? { $unset: { workspaceProvisioningError: "" } }
        : {}),
      $push: { history: entry },
    },
  );
  if (result.modifiedCount !== 1) {
    throw new Error("Bewerbung wurde zwischenzeitlich geändert");
  }

  await addLog(
    input.organizationId,
    input.userId,
    "application.status_change",
    input.application._id,
    entry.details,
  );
  if (input.workspaceUserId && input.decision.decision === "accepted") {
    await addLog(
      input.organizationId,
      input.userId,
      "application.workspace_provisioned",
      input.application._id,
      input.decision.yfnEmail,
    );
  }
}
