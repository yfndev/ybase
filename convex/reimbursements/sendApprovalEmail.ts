import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

const CELL_STYLE = "padding: 8px; border-bottom: 1px solid #eee;";

export function getFileExtension(contentType: string): string {
  if (contentType.includes("pdf")) return "pdf";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  return "pdf";
}

export const sendApprovalEmail = internalAction({
  args: { reimbursementId: v.id("reimbursements") },
  handler: async (ctx, args) => {
    const { Resend } = await import("resend");

    const data = await ctx.runQuery(
      internal.reimbursements.queries.getReimbursementWithDetails,
      { reimbursementId: args.reimbursementId },
    );

    if (!data) return;
    if (!data.organization.accountingEmail) return;

    const attachments = await buildAttachments(ctx, data.receipts);
    const html = buildEmailHtml(data);

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "YBase <info@youngfounders.network>",
      to: [data.organization.accountingEmail],
      cc: data.creator.email ? [data.creator.email] : [],
      subject: `Erstattung genehmigt: ${data.project.name} - ${data.amount.toFixed(2)}€`,
      html,
      attachments,
    });
  },
});

function buildReceiptFilename(
  receipt: { receiptNumber?: string; companyName: string; receiptDate: string },
  index: number,
) {
  const company = receipt.companyName
    .replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 30);
  const date = receipt.receiptDate.replace(/-/g, "");
  const suffix = receipt.receiptNumber ? `_${receipt.receiptNumber}` : "";
  return `beleg_${index + 1}_${company}_${date}${suffix}`;
}

async function buildAttachments(
  ctx: { storage: { getUrl: (id: string) => Promise<string | null> } },
  receipts: Array<{
    fileStorageId: string;
    receiptNumber?: string;
    companyName: string;
    receiptDate: string;
  }>,
) {
  const results = await Promise.all(
    receipts.map(async (receipt, index) => {
      const fileUrl = await ctx.storage.getUrl(receipt.fileStorageId);
      if (!fileUrl) return null;

      const response = await fetch(fileUrl);
      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get("content-type") || "application/pdf";
      const name = buildReceiptFilename(receipt, index);

      return {
        filename: `${name}.${getFileExtension(contentType)}`,
        content: Buffer.from(buffer).toString("base64"),
      };
    }),
  );

  return results.filter((item): item is { filename: string; content: string } => item !== null);
}

function buildEmailHtml(data: {
  type: string;
  amount: number;
  accountHolder: string;
  iban: string;
  bic?: string;
  project: { name: string };
  creator: { name?: string; email?: string };
  receipts: Array<{
    receiptNumber?: string;
    receiptDate: string;
    companyName: string;
    description: string;
    grossAmount: number;
  }>;
  travelDetails?: {
    destination: string;
    startDate: string;
    endDate: string;
    purpose: string;
    mealAllowanceDays?: number;
    mealAllowanceDailyBudget?: number;
  } | null;
}) {
  const typeLabel = data.type === "travel" ? "Reisekostenerstattung" : "Auslagenerstattung";

  const travelRows = data.travelDetails
    ? buildTravelRows(data.travelDetails)
    : "";

  const receiptRows = data.receipts
    .map(
      (receipt) => `
      <tr>
        <td style="${CELL_STYLE}">${receipt.receiptNumber || ""}</td>
        <td style="${CELL_STYLE}">${receipt.receiptDate}</td>
        <td style="${CELL_STYLE}">${receipt.companyName}</td>
        <td style="${CELL_STYLE}">${receipt.description}</td>
        <td style="${CELL_STYLE} text-align: right;">${receipt.grossAmount.toFixed(2)}€</td>
      </tr>`,
    )
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Erstattung genehmigt</h2>
      <p>Eine ${typeLabel} wurde genehmigt und ist zur Auszahlung freigegeben.</p>

      <h3 style="color: #555; margin-top: 24px;">Allgemeine Informationen</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="${CELL_STYLE}"><strong>Art:</strong></td><td style="${CELL_STYLE}">${typeLabel}</td></tr>
        <tr><td style="${CELL_STYLE}"><strong>Projekt:</strong></td><td style="${CELL_STYLE}">${data.project.name}</td></tr>
        <tr><td style="${CELL_STYLE}"><strong>Betrag:</strong></td><td style="${CELL_STYLE}"><strong>${data.amount.toFixed(2)}€</strong></td></tr>
        <tr><td style="${CELL_STYLE}"><strong>Erstellt von:</strong></td><td style="${CELL_STYLE}">${data.creator.name || data.creator.email}</td></tr>
        ${travelRows}
      </table>

      <h3 style="color: #555; margin-top: 24px;">Bankverbindung</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="${CELL_STYLE}"><strong>Kontoinhaber:</strong></td><td style="${CELL_STYLE}">${data.accountHolder}</td></tr>
        <tr><td style="${CELL_STYLE}"><strong>IBAN:</strong></td><td style="${CELL_STYLE}">${data.iban}</td></tr>
        ${data.bic ? `<tr><td style="${CELL_STYLE}"><strong>BIC:</strong></td><td style="${CELL_STYLE}">${data.bic}</td></tr>` : ""}
      </table>

      <h3 style="color: #555; margin-top: 24px;">Belege</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background: #f5f5f5;">
          <th style="padding: 8px; text-align: left;">Nr.</th>
          <th style="padding: 8px; text-align: left;">Datum</th>
          <th style="padding: 8px; text-align: left;">Firma</th>
          <th style="padding: 8px; text-align: left;">Beschreibung</th>
          <th style="padding: 8px; text-align: right;">Betrag</th>
        </tr>
        ${receiptRows}
      </table>

      <p style="margin-top: 24px; color: #666; font-size: 12px;">
        Die Belege sind als Anhang beigefügt.
      </p>
    </div>
  `;
}

function buildTravelRows(travel: {
  destination: string;
  startDate: string;
  endDate: string;
  purpose: string;
  mealAllowanceDays?: number;
  mealAllowanceDailyBudget?: number;
}) {
  let rows = `
    <tr><td style="${CELL_STYLE}"><strong>Reiseziel:</strong></td><td style="${CELL_STYLE}">${travel.destination}</td></tr>
    <tr><td style="${CELL_STYLE}"><strong>Zeitraum:</strong></td><td style="${CELL_STYLE}">${travel.startDate} - ${travel.endDate}</td></tr>
    <tr><td style="${CELL_STYLE}"><strong>Zweck:</strong></td><td style="${CELL_STYLE}">${travel.purpose}</td></tr>
  `;

  if (travel.mealAllowanceDays) {
    const dailyBudget = travel.mealAllowanceDailyBudget?.toFixed(2) || "0.00";
    rows += `<tr><td style="${CELL_STYLE}"><strong>Verpflegungspauschale:</strong></td><td style="${CELL_STYLE}">${travel.mealAllowanceDays} Tage × ${dailyBudget}€</td></tr>`;
  }

  return rows;
}

export const sendRejectionEmail = internalAction({
  args: { reimbursementId: v.id("reimbursements") },
  handler: async (ctx, args) => {
    const { Resend } = await import("resend");

    const data = await ctx.runQuery(
      internal.reimbursements.queries.getReimbursementWithDetails,
      { reimbursementId: args.reimbursementId },
    );

    if (!data) return;
    if (!data.organization.accountingEmail) return;

    const typeLabel = data.type === "travel" ? "Reisekostenerstattung" : "Auslagenerstattung";
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
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
            <tr><td style="${CELL_STYLE}"><strong>Projekt:</strong></td><td style="${CELL_STYLE}">${data.project.name}</td></tr>
            <tr><td style="${CELL_STYLE}"><strong>Betrag:</strong></td><td style="${CELL_STYLE}">${data.amount.toFixed(2)}€</td></tr>
            <tr><td style="${CELL_STYLE}"><strong>Erstellt von:</strong></td><td style="${CELL_STYLE}">${data.creator.name || data.creator.email}</td></tr>
          </table>

          <h3 style="color: #555; margin-top: 24px;">Ablehnungsgrund</h3>
          <div style="background: #fef2f2; border-left: 4px solid #b91c1c; padding: 12px 16px; border-radius: 4px;">
            ${data.rejectionNote ? data.rejectionNote : "Kein Grund angegeben"}
          </div>
        </div>
      `,
    });
  },
});
