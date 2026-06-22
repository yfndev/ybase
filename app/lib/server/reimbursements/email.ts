import {
  organizations,
  projects,
  receipts,
  reimbursements,
  travelDetails,
  users,
} from "../../db/collections";
import type {
  Organization,
  Project,
  Receipt,
  Reimbursement,
  TravelDetails,
  User,
} from "../../db/types";
import { escapeHtml } from "../../email/escape";
import { sendEmail } from "../../email/resend";
import {
  buildAttachments,
  buildEmailHtml,
  CELL_STYLE,
} from "./emailTemplates";

type ReimbursementWithDetails = Reimbursement & {
  organization: Organization;
  creator: User;
  project: Project;
  receipts: Receipt[];
  travelDetails: TravelDetails | null;
};

async function getReimbursementWithDetails(
  reimbursementId: string,
): Promise<ReimbursementWithDetails | null> {
  const reimbursement = await (
    await reimbursements()
  ).findOne({
    _id: reimbursementId,
  });
  if (!reimbursement) return null;

  const [organization, creator, project, receiptList] = await Promise.all([
    (await organizations()).findOne({ _id: reimbursement.organizationId }),
    (await users()).findOne({ _id: reimbursement.createdBy }),
    (await projects()).findOne({ _id: reimbursement.projectId }),
    (await receipts()).find({ reimbursementId }).toArray(),
  ]);

  if (!organization || !creator || !project) return null;

  const travel =
    reimbursement.type === "travel"
      ? await (await travelDetails()).findOne({ reimbursementId })
      : null;

  return {
    ...reimbursement,
    organization,
    creator,
    project,
    receipts: receiptList,
    travelDetails: travel,
  };
}

export function getFileExtension(contentType: string): string {
  if (contentType.includes("pdf")) return "pdf";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  return "pdf";
}

export async function sendApprovalEmail(
  reimbursementId: string,
): Promise<void> {
  const data = await getReimbursementWithDetails(reimbursementId);

  if (!data) return;
  if (!data.organization.accountingEmail) return;

  const attachments = await buildAttachments(data.receipts);
  const html = buildEmailHtml(data);

  await sendEmail({
    from: "YBase <info@youngfounders.network>",
    to: [data.organization.accountingEmail],
    cc: data.creator.email ? [data.creator.email] : [],
    subject: `Erstattung genehmigt: ${data.project.name} - ${data.amount.toFixed(2)}€`,
    html,
    attachments,
  });
}

export async function sendRejectionEmail(
  reimbursementId: string,
): Promise<void> {
  const data = await getReimbursementWithDetails(reimbursementId);

  if (!data) return;
  if (!data.organization.accountingEmail) return;

  const typeLabel =
    data.type === "travel" ? "Reisekostenerstattung" : "Auslagenerstattung";

  await sendEmail({
    from: "YBase <info@youngfounders.network>",
    to: [data.organization.accountingEmail],
    cc: data.creator.email ? [data.creator.email] : [],
    subject: `Erstattung abgelehnt: ${data.project.name} - ${data.amount.toFixed(2)}€`,
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #b91c1c;">Erstattung abgelehnt</h2>
          <p>Eine ${typeLabel} wurde abgelehnt.</p>

          <h3 style="color: #555; margin-top: 24px;">Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="${CELL_STYLE}"><strong>Projekt:</strong></td><td style="${CELL_STYLE}">${escapeHtml(data.project.name)}</td></tr>
            <tr><td style="${CELL_STYLE}"><strong>Betrag:</strong></td><td style="${CELL_STYLE}">${data.amount.toFixed(2)}€</td></tr>
            <tr><td style="${CELL_STYLE}"><strong>Erstellt von:</strong></td><td style="${CELL_STYLE}">${escapeHtml(data.creator.name || data.creator.email)}</td></tr>
          </table>

          <h3 style="color: #555; margin-top: 24px;">Ablehnungsgrund</h3>
          <div style="background: #fef2f2; border-left: 4px solid #b91c1c; padding: 12px 16px; border-radius: 4px;">
            ${data.rejectionNote ? escapeHtml(data.rejectionNote) : "Kein Grund angegeben"}
          </div>
        </div>
      `,
  });
}
