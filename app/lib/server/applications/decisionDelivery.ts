import type { ApplicationDecision } from "../../applications/decisionEmail";
import type { Application } from "../../db/types";
import { sendMail } from "../../email/brevo";
import { BREVO_TEMPLATE_IDS } from "../../email/templates";
import { provisionWorkspaceUser } from "../../googleWorkspace/users";
import { YFN_ORGANIZATION } from "../../organization";
import {
  requireTeamWelcomeTemplateId,
  sendTeamWelcomeEmail,
} from "../users/email";
import { assertAcceptedApplicantMemberAvailable } from "./memberProvisioning";
import {
  recordWorkspaceDeliveryFailure,
  recordWorkspaceProvisioned,
  recordWorkspaceProvisioningFailure,
  reserveWorkspaceProvisioning,
  workspaceApplicantName,
} from "./workspaceProvisioning";

const APPLICATION_EMAIL_SENDER = {
  name: "YBase",
  email: "no-reply@youngfounders.network",
};
const APPLICATION_REPLY_TO = { email: "people@youngfounders.network" };

export type WorkspaceAccessDetails = {
  primaryEmail: string;
  temporaryPassword: string;
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
  await assertAcceptedApplicantMemberAvailable({
    application: input.application,
    email: input.yfnEmail,
  });
  requireTeamWelcomeTemplateId();
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
    };
    return {
      workspaceUserId: account.userId,
      message: input.message,
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
    const recipient = {
      email: input.application.applicantEmail,
      name: input.application.applicantName,
    };
    delivery =
      input.decision === "accepted"
        ? await sendMail({
            to: [recipient],
            sender: APPLICATION_EMAIL_SENDER,
            replyTo: APPLICATION_REPLY_TO,
            subject: input.subject,
            textContent: input.message,
            tags: ["ybase", "application", "application-accepted"],
          })
        : await sendMail({
            to: [recipient],
            templateId: BREVO_TEMPLATE_IDS.APPLICATION_REJECTED,
            subject: input.subject,
            params: {
              applicantName: input.application.applicantName ?? "",
              jobTitle: input.jobTitle,
              organizationName: YFN_ORGANIZATION.name,
              message: input.message,
            },
            tags: ["ybase", "application", "application-rejected"],
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
    try {
      await sendTeamWelcomeEmail({
        recoveryEmail: input.application.applicantEmail,
        memberName: input.application.applicantName,
        workspaceEmail: input.workspaceAccess.primaryEmail,
        temporaryPassword: input.workspaceAccess.temporaryPassword,
      });
    } catch (error) {
      await recordDeliveryFailure(input);
      throw error;
    }
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
