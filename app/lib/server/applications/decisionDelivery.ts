import { appendWorkspaceAccessDetails } from "../../applications/decisionEmail";
import type { ApplicationDecision } from "../../applications/decisionEmail";
import type { Application } from "../../db/types";
import { sendMail } from "../../email/brevo";
import { BREVO_TEMPLATE_IDS } from "../../email/templates";
import { provisionWorkspaceUser } from "../../googleWorkspace/users";
import { YFN_ORGANIZATION } from "../../organization";
import { sendWorkspaceAccountReadyEmail } from "../users/email";
import {
  recordWorkspaceDeliveryFailure,
  recordWorkspaceProvisioned,
  recordWorkspaceProvisioningFailure,
  reserveWorkspaceProvisioning,
  workspaceApplicantName,
  ybaseLoginUrl,
} from "./workspaceProvisioning";

const templateIds = {
  accepted: BREVO_TEMPLATE_IDS.APPLICATION_ACCEPTED,
  rejected: BREVO_TEMPLATE_IDS.APPLICATION_REJECTED,
};

export type WorkspaceAccessDetails = {
  primaryEmail: string;
  temporaryPassword: string;
  loginUrl: string;
};

export async function prepareAcceptance(input: {
  application: Application;
  organizationId: string;
  message: string;
  yfnEmail: string;
}): Promise<{
  message: string;
  workspaceUserId: string;
  workspaceAccess: WorkspaceAccessDetails;
}> {
  const loginUrl = ybaseLoginUrl();
  const reservation = await reserveWorkspaceProvisioning({
    application: input.application,
    organizationDomain: YFN_ORGANIZATION.domain,
    yfnEmail: input.yfnEmail,
  });

  try {
    const account = await provisionWorkspaceUser({
      applicationId: input.application._id,
      existingUserId: reservation.existingWorkspaceUserId,
      primaryEmail: reservation.yfnEmail,
      recoveryEmail: input.application.applicantEmail,
      ...workspaceApplicantName(input.application),
    });
    await recordWorkspaceProvisioned({
      applicationId: input.application._id,
      organizationId: input.organizationId,
      workspaceUserId: account.userId,
    });
    const workspaceAccess: WorkspaceAccessDetails = {
      primaryEmail: account.primaryEmail,
      temporaryPassword: account.temporaryPassword,
      loginUrl,
    };
    return {
      workspaceUserId: account.userId,
      message: appendWorkspaceAccessDetails({
        message: input.message,
        primaryEmail: workspaceAccess.primaryEmail,
        temporaryPassword: workspaceAccess.temporaryPassword,
        loginUrl,
      }),
      workspaceAccess,
    };
  } catch (error) {
    await recordWorkspaceProvisioningFailure({
      applicationId: input.application._id,
      organizationId: input.organizationId,
      error,
    });
    throw error;
  }
}

export async function sendDecisionEmail(input: {
  application: Application;
  decision: ApplicationDecision;
  jobTitle: string;
  message: string;
  organizationId: string;
  subject: string;
  workspaceUserId?: string;
  workspaceAccess?: WorkspaceAccessDetails;
}): Promise<void> {
  let delivery: Awaited<ReturnType<typeof sendMail>>;
  try {
    delivery = await sendMail({
      to: [
        {
          email: input.application.applicantEmail,
          name: input.application.applicantName,
        },
      ],
      templateId: templateIds[input.decision],
      subject: input.subject,
      params: {
        applicantName: input.application.applicantName ?? "",
        jobTitle: input.jobTitle,
        organizationName: YFN_ORGANIZATION.name,
        message: input.message,
      },
      tags: ["ybase", "application", `application-${input.decision}`],
    });
  } catch (error) {
    await recordDeliveryFailure(input);
    throw error;
  }

  if (delivery.status !== "sent") {
    await recordDeliveryFailure(input);
    throw new Error("E-Mail konnte nicht versendet werden");
  }

  if (input.decision === "accepted" && input.workspaceAccess) {
    await sendWorkspaceAccountReadyEmail({
      recoveryEmail: input.application.applicantEmail,
      applicantName: input.application.applicantName,
      workspaceEmail: input.workspaceAccess.primaryEmail,
      temporaryPassword: input.workspaceAccess.temporaryPassword,
      loginUrl: input.workspaceAccess.loginUrl,
    });
  }
}

async function recordDeliveryFailure(input: {
  application: Application;
  organizationId: string;
  workspaceUserId?: string;
}): Promise<void> {
  if (!input.workspaceUserId) return;
  await recordWorkspaceDeliveryFailure({
    applicationId: input.application._id,
    organizationId: input.organizationId,
  });
}
