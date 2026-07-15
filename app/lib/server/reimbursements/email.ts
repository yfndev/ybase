import {
  organizations,
  projects,
  reimbursements,
  users,
} from "../../db/collections";
import type {
  Organization,
  Project,
  Reimbursement,
  User,
} from "../../db/types";
import { type EmailRecipient, sendMail } from "../../email/brevo";
import { BREVO_TEMPLATE_IDS } from "../../email/templates";
import { appUrl } from "../../email/urls";

type ReimbursementMailData = Reimbursement & {
  organization: Organization;
  creator: User;
  project: Project;
};

function formatAmount(amount: number, currency = "EUR"): string {
  try {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatDate(timestamp?: number): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(timestamp ?? Date.now()));
}

async function getMailData(
  reimbursementId: string,
): Promise<ReimbursementMailData | null> {
  const reimbursement = await (
    await reimbursements()
  ).findOne({
    _id: reimbursementId,
  });
  if (!reimbursement) return null;

  const [organization, creator, project] = await Promise.all([
    (await organizations()).findOne({ _id: reimbursement.organizationId }),
    (await users()).findOne({
      _id: reimbursement.createdBy,
      organizationId: reimbursement.organizationId,
    }),
    (await projects()).findOne({
      _id: reimbursement.projectId,
      organizationId: reimbursement.organizationId,
    }),
  ]);

  if (!organization || !creator || !project) return null;
  return { ...reimbursement, organization, creator, project };
}

function submitterRecipient(
  data: ReimbursementMailData,
): EmailRecipient | null {
  const email =
    data.submitterEmail ??
    (data.requestedExternally ? undefined : data.creator.email);
  if (!email) return null;
  return {
    email,
    name: data.submitterName ?? data.creator.name,
  };
}

function invitedRecipient(data: ReimbursementMailData): EmailRecipient | null {
  if (!data.invitedEmail) return null;
  return { email: data.invitedEmail, name: data.invitedName };
}

function documentType(data: ReimbursementMailData): string {
  return data.type === "travel"
    ? "Reisekostenerstattung"
    : "Auslagenerstattung";
}

function submissionUrl(data: ReimbursementMailData): string {
  return appUrl(
    data.isSharedLink
      ? `/erstattung/${data._id}`
      : `/reimbursements/${data._id}`,
  );
}

type LifecycleEvent =
  | "requested"
  | "received"
  | "changes-requested"
  | "approved"
  | "rejected";

const TEMPLATE_BY_EVENT: Record<LifecycleEvent, number> = {
  requested: BREVO_TEMPLATE_IDS.SUBMISSION_REQUESTED,
  received: BREVO_TEMPLATE_IDS.SUBMISSION_RECEIVED,
  "changes-requested": BREVO_TEMPLATE_IDS.CHANGES_REQUESTED,
  approved: BREVO_TEMPLATE_IDS.SUBMISSION_APPROVED,
  rejected: BREVO_TEMPLATE_IDS.SUBMISSION_REJECTED,
};

async function sendLifecycleEmail(
  reimbursementId: string,
  event: LifecycleEvent,
): Promise<void> {
  if (!process.env.BREVO_API_KEY) return;

  try {
    const data = await getMailData(reimbursementId);
    if (!data) return;

    const to =
      event === "requested" ? invitedRecipient(data) : submitterRecipient(data);
    const accountingEmail = data.organization.accountingEmail;
    if (!to || !accountingEmail) return;

    await sendMail({
      to: [to],
      replyTo: { email: accountingEmail },
      templateId: TEMPLATE_BY_EVENT[event],
      params: {
        recipientName: to.name ?? "",
        accountingEmail,
        documentType: documentType(data),
        projectName: data.project.name,
        amount: formatAmount(data.amount, data.currency),
        reviewedAt: formatDate(data.reviewedAt),
        reviewMessage: data.reviewNote ?? data.rejectionNote ?? "",
        submissionUrl: submissionUrl(data),
      },
      tags: ["ybase", "reimbursement", `submission-${event}`],
    });
  } catch (error) {
    console.error(
      `Could not send ${event} email for reimbursement ${reimbursementId}`,
      error,
    );
  }
}

export function sendApprovalEmail(reimbursementId: string): Promise<void> {
  return sendLifecycleEmail(reimbursementId, "approved");
}

export function sendRejectionEmail(reimbursementId: string): Promise<void> {
  return sendLifecycleEmail(reimbursementId, "rejected");
}

export function sendSubmissionRequestedEmail(
  reimbursementId: string,
): Promise<void> {
  return sendLifecycleEmail(reimbursementId, "requested");
}

export function sendSubmissionReceivedEmail(
  reimbursementId: string,
): Promise<void> {
  return sendLifecycleEmail(reimbursementId, "received");
}

export function sendChangesRequestedEmail(
  reimbursementId: string,
): Promise<void> {
  return sendLifecycleEmail(reimbursementId, "changes-requested");
}
