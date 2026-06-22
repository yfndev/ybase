import { PDFDocument, StandardFonts } from "pdf-lib";
import type { Fonts } from "./reimbursementPdf/primitives";
import { WIDTH, HEIGHT } from "./reimbursementPdf/primitives";
import { drawFooter, drawHeader } from "./volunteerAllowancePdf/chrome";
import type { VolunteerAllowanceData } from "./volunteerAllowancePdf/data";
import { drawBody, type Cursor } from "./volunteerAllowancePdf/sections";
import { drawSignature } from "./volunteerAllowancePdf/signature";

export type { VolunteerAllowanceData } from "./volunteerAllowancePdf/data";

export async function generateVolunteerAllowancePDF(
  data: VolunteerAllowanceData,
  signatureUrl: string | null,
) {
  const pdfDoc = await PDFDocument.create();
  const fonts: Fonts = {
    font: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  };

  const page = pdfDoc.addPage([WIDTH, HEIGHT]);
  drawHeader(page, fonts, data);
  drawFooter(page, fonts);

  const cursor: Cursor = { y: 755 };
  drawBody(page, fonts, cursor, data);
  await drawSignature(pdfDoc, page, fonts, cursor, signatureUrl);

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], {
    type: "application/pdf",
  });
}
