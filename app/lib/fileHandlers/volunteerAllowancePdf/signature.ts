import type { PDFDocument, PDFPage } from "pdf-lib";
import { rgb } from "pdf-lib";
import type { Fonts } from "../reimbursementPdf/primitives";
import { text, WIDTH } from "../reimbursementPdf/primitives";
import { M, TEXT_MUTED } from "./data";
import type { Cursor } from "./sections";

const SIGN_BORDER = rgb(0.3, 0.3, 0.3);

async function embedSignature(
  pdfDoc: PDFDocument,
  page: PDFPage,
  cursor: Cursor,
  signatureUrl: string,
) {
  try {
    const response = await fetch(signatureUrl);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const image = await pdfDoc.embedPng(bytes);
    const scale = Math.min(180 / image.width, 55 / image.height);
    page.drawImage(image, {
      x: M,
      y: cursor.y - image.height * scale,
      width: image.width * scale,
      height: image.height * scale,
    });
    cursor.y -= image.height * scale + 8;
  } catch (error) {
    console.error("Failed to embed signature:", error);
  }
}

export async function drawSignature(
  pdfDoc: PDFDocument,
  page: PDFPage,
  fonts: Fonts,
  cursor: Cursor,
  signatureUrl: string | null,
) {
  cursor.y -= 20;

  if (signatureUrl) {
    await embedSignature(pdfDoc, page, cursor, signatureUrl);
  }

  page.drawLine({
    start: { x: M, y: cursor.y },
    end: { x: M + 220, y: cursor.y },
    thickness: 0.5,
    color: SIGN_BORDER,
  });
  cursor.y -= 14;
  text(
    page,
    "Unterschrift Ehrenamtliche/r",
    M,
    cursor.y,
    8.5,
    fonts.font,
    TEXT_MUTED,
  );

  const rightX = WIDTH / 2 + 20;
  page.drawLine({
    start: { x: rightX, y: cursor.y + 14 },
    end: { x: rightX + 220, y: cursor.y + 14 },
    thickness: 0.5,
    color: SIGN_BORDER,
  });
  text(
    page,
    "Unterschrift Vorstand / Verein",
    rightX,
    cursor.y,
    8.5,
    fonts.font,
    TEXT_MUTED,
  );
}
