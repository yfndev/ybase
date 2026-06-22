import { escapeHtml } from "../../email/escape";
import type { EmailAttachment } from "../../email/resend";
import { getObjectBuffer } from "../../s3/storage";

export const CELL_STYLE = "padding: 8px; border-bottom: 1px solid #eee;";

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

export async function buildAttachments(
  receiptList: Array<{
    fileStorageId: string;
    receiptNumber?: string;
    companyName: string;
    receiptDate: string;
  }>,
): Promise<EmailAttachment[]> {
  const results = await Promise.all(
    receiptList.map(async (receipt, index) => {
      const buffer = await getObjectBuffer(receipt.fileStorageId);
      const name = buildReceiptFilename(receipt, index);
      return {
        filename: `${name}.pdf`,
        content: buffer.toString("base64"),
      };
    }),
  );

  return results;
}

export function buildEmailHtml(data: {
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
  const typeLabel =
    data.type === "travel" ? "Reisekostenerstattung" : "Auslagenerstattung";

  const travelRows = data.travelDetails
    ? buildTravelRows(data.travelDetails)
    : "";

  const receiptRows = data.receipts
    .map(
      (receipt) => `
      <tr>
        <td style="${CELL_STYLE}">${escapeHtml(receipt.receiptNumber)}</td>
        <td style="${CELL_STYLE}">${receipt.receiptDate}</td>
        <td style="${CELL_STYLE}">${escapeHtml(receipt.companyName)}</td>
        <td style="${CELL_STYLE}">${escapeHtml(receipt.description)}</td>
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
        <tr><td style="${CELL_STYLE}"><strong>Projekt:</strong></td><td style="${CELL_STYLE}">${escapeHtml(data.project.name)}</td></tr>
        <tr><td style="${CELL_STYLE}"><strong>Betrag:</strong></td><td style="${CELL_STYLE}"><strong>${data.amount.toFixed(2)}€</strong></td></tr>
        <tr><td style="${CELL_STYLE}"><strong>Erstellt von:</strong></td><td style="${CELL_STYLE}">${escapeHtml(data.creator.name || data.creator.email)}</td></tr>
        ${travelRows}
      </table>

      <h3 style="color: #555; margin-top: 24px;">Bankverbindung</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="${CELL_STYLE}"><strong>Kontoinhaber:</strong></td><td style="${CELL_STYLE}">${escapeHtml(data.accountHolder)}</td></tr>
        <tr><td style="${CELL_STYLE}"><strong>IBAN:</strong></td><td style="${CELL_STYLE}">${escapeHtml(data.iban)}</td></tr>
        ${data.bic ? `<tr><td style="${CELL_STYLE}"><strong>BIC:</strong></td><td style="${CELL_STYLE}">${escapeHtml(data.bic)}</td></tr>` : ""}
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
    <tr><td style="${CELL_STYLE}"><strong>Reiseziel:</strong></td><td style="${CELL_STYLE}">${escapeHtml(travel.destination)}</td></tr>
    <tr><td style="${CELL_STYLE}"><strong>Zeitraum:</strong></td><td style="${CELL_STYLE}">${travel.startDate} - ${travel.endDate}</td></tr>
    <tr><td style="${CELL_STYLE}"><strong>Zweck:</strong></td><td style="${CELL_STYLE}">${escapeHtml(travel.purpose)}</td></tr>
  `;

  if (travel.mealAllowanceDays) {
    const dailyBudget = travel.mealAllowanceDailyBudget?.toFixed(2) || "0.00";
    rows += `<tr><td style="${CELL_STYLE}"><strong>Verpflegungspauschale:</strong></td><td style="${CELL_STYLE}">${travel.mealAllowanceDays} Tage × ${dailyBudget}€</td></tr>`;
  }

  return rows;
}
