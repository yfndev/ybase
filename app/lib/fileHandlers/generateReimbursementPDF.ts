import { PDFDocument, type PDFImage, StandardFonts } from "pdf-lib";
import { drawBottomSection } from "./reimbursementPdf/bottomSection";
import {
  buildLineItems,
  buildTotals,
  EMPTY_ORG,
  type ReceiptInput,
  type ReimbursementData,
  type ReimbursementInput,
} from "./reimbursementPdf/data";
import { drawAddressBlock, drawHeader } from "./reimbursementPdf/formPage";
import {
  embedFile,
  type Fonts,
  fetchBytes,
  HEIGHT,
  M,
  text,
  WIDTH,
} from "./reimbursementPdf/primitives";
import { drawTableHeader, drawTableRow, ROW_H } from "./reimbursementPdf/table";

const TABLE_MIN_Y = 60;
const BOTTOM_H = 200;

function toData(
  reimbursement: ReimbursementInput,
  signatureBytes: Uint8Array | null,
): ReimbursementData {
  const name = reimbursement.accountHolder || reimbursement.submitterName || "";
  return {
    type: reimbursement.type,
    accountHolder: name,
    amount: reimbursement.amount || 0,
    iban: reimbursement.iban || "",
    bic: reimbursement.bic,
    createdAt: reimbursement._creationTime,
    organization: { ...EMPTY_ORG, ...(reimbursement.organization || {}) },
    signatureBytes,
  };
}

async function loadLogo(pdfDoc: PDFDocument): Promise<PDFImage | null> {
  const bytes = await fetchBytes("/yfn-logo.png");
  if (!bytes) return null;
  try {
    return await pdfDoc.embedPng(bytes);
  } catch {
    return null;
  }
}

async function drawReceiptPage(
  pdfDoc: PDFDocument,
  fonts: Fonts,
  receipt: ReceiptInput,
  index: number,
) {
  const bytes = receipt.fileUrl ? await fetchBytes(receipt.fileUrl) : null;
  if (!bytes) return;
  const embedded = await embedFile(pdfDoc, bytes);
  if (!embedded) return;

  const page = pdfDoc.addPage([WIDTH, HEIGHT]);
  const label = `Beleg ${receipt.receiptNumber || index + 1}: ${receipt.companyName || ""}`;
  text(page, label, M, HEIGHT - 40, 11, fonts.bold);

  const scale = Math.min(
    (WIDTH - 2 * M) / embedded.width,
    (HEIGHT - 90) / embedded.height,
    1,
  );
  const w = embedded.width * scale;
  const h = embedded.height * scale;
  const x = (WIDTH - w) / 2;
  const y = HEIGHT - 60 - h;
  if (embedded.kind === "pdf") {
    page.drawPage(embedded.draw, { x, y, xScale: scale, yScale: scale });
  } else {
    page.drawImage(embedded.image, { x, y, width: w, height: h });
  }
}

export async function generateReimbursementPDF(
  reimbursement: ReimbursementInput,
  receipts: ReceiptInput[] = [],
) {
  const pdfDoc = await PDFDocument.create();
  const fonts: Fonts = {
    font: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  };

  const signatureBytes = reimbursement.signatureUrl
    ? await fetchBytes(reimbursement.signatureUrl)
    : null;
  const data = toData(reimbursement, signatureBytes);
  const items = buildLineItems(reimbursement, receipts);
  const totals = buildTotals(items);
  const logo = await loadLogo(pdfDoc);

  const verb =
    data.type === "travel" ? "Reisekostenerstattung" : "Auslagenerstattung";
  const title = `${verb} für ${data.accountHolder}:`;

  let page = pdfDoc.addPage([WIDTH, HEIGHT]);
  drawHeader(page, fonts, title, logo);
  let y = drawAddressBlock(page, fonts, data);
  text(page, "Auflistung von Belegen und Reisekosten:", M, y, 9, fonts.bold);
  y = drawTableHeader(page, fonts, y - 10);

  for (const item of items) {
    if (y - ROW_H < TABLE_MIN_Y) {
      page = pdfDoc.addPage([WIDTH, HEIGHT]);
      drawHeader(page, fonts, title, logo);
      y = drawTableHeader(page, fonts, HEIGHT - 100);
    }
    drawTableRow(page, fonts, item, y);
    y -= ROW_H;
  }

  let bottomTop = Math.min(y - 24, 300);
  if (bottomTop < BOTTOM_H + 10) {
    page = pdfDoc.addPage([WIDTH, HEIGHT]);
    drawHeader(page, fonts, title, logo);
    bottomTop = HEIGHT - 110;
  }
  await drawBottomSection(pdfDoc, page, fonts, bottomTop, data, totals);

  for (let i = 0; i < receipts.length; i++) {
    await drawReceiptPage(pdfDoc, fonts, receipts[i], i);
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], {
    type: "application/pdf",
  });
}
