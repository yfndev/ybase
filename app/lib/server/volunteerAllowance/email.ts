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

function recipient(data: VolunteerAllowanceWithDetails): EmailRecipient | null {
  return data.creator.email
    ? { email: data.creator.email, name: data.creator.name }
    : null;
}

async function sendDecisionEmail(
  id: string,
  decision: "approved" | "rejected",
): Promise<void> {
  if (!process.env.BREVO_API_KEY) return;

  try {
    const data = await getWithDetails(id);
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
        recipientName: to.name ?? data.volunteerName,
        accountingEmail,
        documentType: "Ehrenamtspauschale",
        projectName: data.project.name,
        amount: formatAmount(data.amount),
        reviewedAt: formatDate(data.reviewedAt),
        reviewMessage: data.rejectionNote ?? "",
        submissionUrl: appUrl("/reimbursements"),
      },
      tags: ["ybase", "volunteer-allowance", `submission-${decision}`],
    });
  } catch (error) {
    console.error(
      `Could not send ${decision} email for allowance ${id}`,
      error,
    );
  }
}

export function sendApprovalEmail(id: string): Promise<void> {
  return sendDecisionEmail(id, "approved");
}

export function sendRejectionEmail(id: string): Promise<void> {
  return sendDecisionEmail(id, "rejected");
}
