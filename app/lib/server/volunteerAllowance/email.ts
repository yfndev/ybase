import { type EmailRecipient, sendMail } from "../../email/brevo";
import { BREVO_TEMPLATE_IDS } from "../../email/templates";
import { appUrl } from "../../email/urls";
import type { VolunteerAllowanceWithDetails } from "./data";
import { getWithDetails } from "./data";

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatDate(timestamp?: number): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(timestamp ?? Date.now()));
}

function submitterRecipient(
  data: VolunteerAllowanceWithDetails,
): EmailRecipient | null {
  const email =
    data.submitterEmail ??
    (data.requestedExternally ? undefined : data.creator.email);
  if (!email) return null;
  return { email, name: data.volunteerName || data.creator.name };
}

function invitedRecipient(
  data: VolunteerAllowanceWithDetails,
): EmailRecipient | null {
  if (!data.invitedEmail) return null;
  return { email: data.invitedEmail, name: data.invitedName };
}

function submissionUrl(data: VolunteerAllowanceWithDetails): string {
  return appUrl(
    data.isSharedLink ? `/ehrenamtspauschale/${data._id}` : "/reimbursements",
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
  id: string,
  event: LifecycleEvent,
): Promise<void> {
  if (!process.env.BREVO_API_KEY) return;

  try {
    const data = await getWithDetails(id);
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
        recipientName: to.name ?? data.volunteerName,
        accountingEmail,
        documentType: "Ehrenamtspauschale",
        projectName: data.project.name,
        amount: formatAmount(data.amount),
        reviewedAt: formatDate(data.reviewedAt),
        reviewMessage: data.reviewNote ?? data.rejectionNote ?? "",
        submissionUrl: submissionUrl(data),
      },
      tags: ["ybase", "volunteer-allowance", `submission-${event}`],
    });
  } catch (error) {
    console.error(`Could not send ${event} email for allowance ${id}`, error);
  }
}

export function sendApprovalEmail(id: string): Promise<void> {
  return sendLifecycleEmail(id, "approved");
}

export function sendRejectionEmail(id: string): Promise<void> {
  return sendLifecycleEmail(id, "rejected");
}

export function sendSubmissionRequestedEmail(id: string): Promise<void> {
  return sendLifecycleEmail(id, "requested");
}

export function sendSubmissionReceivedEmail(id: string): Promise<void> {
  return sendLifecycleEmail(id, "received");
}

export function sendChangesRequestedEmail(id: string): Promise<void> {
  return sendLifecycleEmail(id, "changes-requested");
}
