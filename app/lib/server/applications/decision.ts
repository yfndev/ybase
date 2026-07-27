"use server";

import { z } from "zod";
import { appendWorkspaceAccessDetails } from "../../applications/decisionEmail";
import { APPLICATION_STATUS_LABELS } from "../../applications/status";
import { isApplicationStatusTransitionAllowed } from "../../applications/transitions";
import { applications, jobPostings } from "../../db/collections";
import { sendMail } from "../../email/brevo";
import { BREVO_TEMPLATE_IDS } from "../../email/templates";
import { provisionWorkspaceUser } from "../../googleWorkspace/users";
import { YFN_ORGANIZATION } from "../../organization";
import { addLog } from "../logs";
import { loadOwnedApplication } from "./access";
import { createApplicationHistoryEntry } from "./history";
import {
  recordWorkspaceDeliveryFailure,
  recordWorkspaceProvisioned,
  recordWorkspaceProvisioningFailure,
  reserveWorkspaceProvisioning,
  workspaceApplicantName,
  ybaseLoginUrl,
} from "./workspaceProvisioning";

const messageSchema = {
  applicationId: z.string().min(1),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(10_000),
};

const inputSchema = z.discriminatedUnion("decision", [
  z.object({
    ...messageSchema,
    decision: z.literal("accepted"),
    yfnEmail: z.string().trim().email().max(320),
  }),
  z.object({
    ...messageSchema,
    decision: z.literal("rejected"),
  }),
]);

const templateIds = {
  accepted: BREVO_TEMPLATE_IDS.APPLICATION_ACCEPTED,
  rejected: BREVO_TEMPLATE_IDS.APPLICATION_REJECTED,
};

export async function sendApplicationDecision(
  input: z.input<typeof inputSchema>,
): Promise<void> {
  const parsed = inputSchema.parse(input);
  const { user, application } = await loadOwnedApplication(
    parsed.applicationId,
  );
  if (
    !isApplicationStatusTransitionAllowed(application.status, parsed.decision)
  ) {
    throw new Error("Dieser Statuswechsel ist nicht zulässig");
  }
  const isProvisioning =
    application.workspaceProvisioningStatus === "pending" ||
    application.workspaceProvisioningStatus === "provisioned";
  if (parsed.decision === "rejected" && isProvisioning) {
    throw new Error("Das Workspace-Konto wird bereits eingerichtet");
  }

  const posting = await (
    await jobPostings()
  ).findOne({
    _id: application.jobPostingId,
    organizationId: user.organizationId,
  });
  if (!posting) throw new Error("Ausschreibung nicht gefunden");

  let message = parsed.message;
  let workspaceUserId: string | undefined;
  if (parsed.decision === "accepted") {
    const loginUrl = ybaseLoginUrl();
    const reservation = await reserveWorkspaceProvisioning({
      application,
      organizationDomain: YFN_ORGANIZATION.domain,
      yfnEmail: parsed.yfnEmail,
    });
    try {
      const account = await provisionWorkspaceUser({
        applicationId: application._id,
        existingUserId: reservation.existingWorkspaceUserId,
        primaryEmail: reservation.yfnEmail,
        recoveryEmail: application.applicantEmail,
        ...workspaceApplicantName(application),
      });
      workspaceUserId = account.userId;
      await recordWorkspaceProvisioned({
        applicationId: application._id,
        organizationId: user.organizationId,
        workspaceUserId,
      });
      message = appendWorkspaceAccessDetails({
        message,
        primaryEmail: account.primaryEmail,
        temporaryPassword: account.temporaryPassword,
        loginUrl,
      });
    } catch (error) {
      await recordWorkspaceProvisioningFailure({
        applicationId: application._id,
        organizationId: user.organizationId,
        error,
      });
      throw error;
    }
  }

  let delivery: Awaited<ReturnType<typeof sendMail>>;
  try {
    delivery = await sendMail({
      to: [
        { email: application.applicantEmail, name: application.applicantName },
      ],
      templateId: templateIds[parsed.decision],
      subject: parsed.subject,
      params: {
        applicantName: application.applicantName ?? "",
        jobTitle: posting.title,
        organizationName: YFN_ORGANIZATION.name,
        message,
      },
      tags: ["ybase", "application", `application-${parsed.decision}`],
    });
  } catch (error) {
    if (workspaceUserId) {
      await recordWorkspaceDeliveryFailure({
        applicationId: application._id,
        organizationId: user.organizationId,
      });
    }
    throw error;
  }
  if (delivery.status !== "sent") {
    if (workspaceUserId) {
      await recordWorkspaceDeliveryFailure({
        applicationId: application._id,
        organizationId: user.organizationId,
      });
    }
    throw new Error("E-Mail konnte nicht versendet werden");
  }

  const entry = createApplicationHistoryEntry(
    user._id,
    "status_changed",
    `${APPLICATION_STATUS_LABELS[application.status]} → ${APPLICATION_STATUS_LABELS[parsed.decision]}`,
    { fromStatus: application.status, toStatus: parsed.decision },
  );
  const result = await (
    await applications()
  ).updateOne(
    {
      _id: application._id,
      organizationId: user.organizationId,
      status: application.status,
      ...(workspaceUserId
        ? { workspaceProvisioningStatus: "provisioned" }
        : {}),
    },
    {
      $set: {
        status: parsed.decision,
        updatedAt: entry.timestamp,
        ...(workspaceUserId
          ? { workspaceProvisioningStatus: "invited" as const }
          : {}),
      },
      ...(workspaceUserId
        ? { $unset: { workspaceProvisioningError: "" } }
        : {}),
      $push: { history: entry },
    },
  );
  if (result.modifiedCount !== 1) {
    throw new Error("Bewerbung wurde zwischenzeitlich geändert");
  }
  await addLog(
    user.organizationId,
    user._id,
    "application.status_change",
    application._id,
    entry.details,
  );
  if (workspaceUserId && parsed.decision === "accepted") {
    await addLog(
      user.organizationId,
      user._id,
      "application.workspace_provisioned",
      application._id,
      parsed.yfnEmail,
    );
  }
}
