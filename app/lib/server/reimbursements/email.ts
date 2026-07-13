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
    (await users()).findOne({ _id: reimbursement.createdBy }),
    (await projects()).findOne({ _id: reimbursement.projectId }),
  ]);

  if (!organization || !creator || !project) return null;
  return { ...reimbursement, organization, creator, project };
}

function recipient(data: ReimbursementMailData): EmailRecipient | null {
  const email = data.submitterEmail ?? data.creator.email;
  if (!email) return null;
  return {
    email,
    name: data.submitterName ?? data.creator.name,
  };
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

async function sendDecisionEmail(
  reimbursementId: string,
  decision: "approved" | "rejected",
): Promise<void> {
  if (!process.env.BREVO_API_KEY) return;

  try {
    const data = await getMailData(reimbursementId);
    if (!data) return;

    const to = recipient(data);
    const accountingEmail = data.organization.accountingEmail;
    if (!to || !accountingEmail) return;

    await sendMail({
      to: [to],
      replyTo: { email: accountingEmail },
      templateId:
        decision === "approved"
          ? BREVO_TEMPLATE_IDS.SUBMISSION_APPROVED
          : BREVO_TEMPLATE_IDS.SUBMISSION_REJECTED,
      params: {
        recipientName: to.name ?? "",
        accountingEmail,
        documentType: documentType(data),
        projectName: data.project.name,
        amount: formatAmount(data.amount, data.currency),
        reviewedAt: formatDate(data.reviewedAt),
        reviewMessage: data.rejectionNote ?? "",
        submissionUrl: submissionUrl(data),
      },
      tags: ["ybase", "reimbursement", `submission-${decision}`],
    });
  } catch (error) {
    console.error(
      `Could not send ${decision} email for reimbursement ${reimbursementId}`,
      error,
    );
  }
}

export function sendApprovalEmail(reimbursementId: string): Promise<void> {
  return sendDecisionEmail(reimbursementId, "approved");
}

export function sendRejectionEmail(reimbursementId: string): Promise<void> {
  return sendDecisionEmail(reimbursementId, "rejected");
}
