import {
  PDFDocument,
  type PDFFont,
  type PDFPage,
  StandardFonts,
} from "pdf-lib";
import { buildTravelPdfData } from "./travelReimbursementPdf/data";
import type { TravelPdfField } from "./travelReimbursementPdf/types";
import {
  FIELD_POSITIONS,
  MODE_MARKS,
  SIGNATURE_POSITION,
  TEMPLATE_URL,
  TRAVEL_TYPE_MARKS,
} from "./travelReimbursementPdf/template";
import type { ReceiptInput, ReimbursementInput } from "./reimbursementPdf/data";
import { appendReceiptPages } from "./reimbursementPdf/receiptAppendix";
import {
  BLACK,
  embedFile,
  type Fonts,
  fetchBytes,
  fitText,
  text,
  textRight,
} from "./reimbursementPdf/primitives";

function drawField(
  pages: PDFPage[],
  font: PDFFont,
  field: TravelPdfField,
  value: string,
) {
  const position = FIELD_POSITIONS[field];
  if (!position || !value) return;

  const [pageIndex, x, y, width, height, align] = position;
  const page = pages[pageIndex];
  const size = height > 20 ? 8 : 7.5;
  const shown = fitText(value, font, size, width - 5);
  const textY = y + (height - size) / 2 + 0.5;
  if (align === "right") {
    textRight(page, shown, x + width - 2.5, textY, size, font);
    return;
  }
  text(page, shown, x + 2.5, textY, size, font);
}

function drawMark(page: PDFPage, position: { x: number; y: number }) {
  const radius = 3.5;
  page.drawLine({
    start: { x: position.x - radius, y: position.y - radius },
    end: { x: position.x + radius, y: position.y + radius },
    thickness: 1.2,
    color: BLACK,
  });
  page.drawLine({
    start: { x: position.x - radius, y: position.y + radius },
    end: { x: position.x + radius, y: position.y - radius },
    thickness: 1.2,
    color: BLACK,
  });
}

async function drawSignature(
  pdfDoc: PDFDocument,
  pages: PDFPage[],
  signatureUrl?: string | null,
) {
  if (!signatureUrl) return;
  const bytes = await fetchBytes(signatureUrl);
  if (!bytes) return;
  const embedded = await embedFile(pdfDoc, bytes);
  if (!embedded || embedded.kind !== "image") return;

  const [pageIndex, x, y, maxWidth, maxHeight] = SIGNATURE_POSITION;
  const scale = Math.min(
    (maxWidth - 8) / embedded.width,
    (maxHeight - 8) / embedded.height,
  );
  const width = embedded.width * scale;
  const height = embedded.height * scale;
  pages[pageIndex].drawImage(embedded.image, {
    x: x + (maxWidth - width) / 2,
    y: y + (maxHeight - height) / 2,
    width,
    height,
  });
}

export async function generateTravelReimbursementPDF(
  reimbursement: ReimbursementInput,
  receipts: ReceiptInput[] = [],
) {
  const templateBytes = await fetchBytes(TEMPLATE_URL);
  if (!templateBytes) throw new Error("Reisekostenformular nicht verfügbar");

  const pdfDoc = await PDFDocument.load(templateBytes);
  const fonts: Fonts = {
    font: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  };
  const pages = pdfDoc.getPages();
  const data = buildTravelPdfData(reimbursement, receipts);

  for (const [field, value] of Object.entries(data.fields)) {
    drawField(pages, fonts.font, field as TravelPdfField, value);
  }

  drawMark(
    pages[0],
    data.isInternational
      ? TRAVEL_TYPE_MARKS.international
      : TRAVEL_TYPE_MARKS.domestic,
  );
  for (const mode of data.modes) drawMark(pages[0], MODE_MARKS[mode]);

  await drawSignature(pdfDoc, pages, reimbursement.signatureUrl);
  await appendReceiptPages(pdfDoc, fonts, receipts);

  pdfDoc.setTitle(
    `Reisekostenerstattung ${data.fields.employeeName || ""}`,
  );

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], {
    type: "application/pdf",
  });
}
