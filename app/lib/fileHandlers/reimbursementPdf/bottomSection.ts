import type { PDFDocument, PDFPage } from "pdf-lib";
import type { ReimbursementData, Totals } from "./data";
import {
  BORDER,
  box,
  boxValue,
  dateFmt,
  embedFile,
  eur,
  type Fonts,
  fitText,
  GRAY,
  LIGHT_GRAY,
  M,
  RED,
  RIGHT,
  text,
  textRight,
} from "./primitives";

const ACCOUNTING_LABELS = [
  "Bearbeiter:",
  "Bearbeitungsdatum:",
  "Kostenstelle(n):",
  "Auslagenerstattung Nr.:",
  "Ort, Datum:",
  "Unterschrift:",
];

function drawAccountingBox(
  page: PDFPage,
  fonts: Fonts,
  top: number,
  width: number,
) {
  box(page, M, top - 196, width, 196, LIGHT_GRAY);
  text(
    page,
    "Wird von der Buchhaltung ausgefüllt!",
    M + 8,
    top - 18,
    8,
    fonts.bold,
    RED,
  );
  let y = top - 46;
  for (const label of ACCOUNTING_LABELS) {
    text(page, label, M + 8, y, 9, fonts.bold);
    y -= 28;
  }
}

async function drawSignature(
  pdfDoc: PDFDocument,
  page: PDFPage,
  fonts: Fonts,
  data: ReimbursementData,
  x: number,
  top: number,
  width: number,
) {
  const h = 64;
  box(page, x, top - h, width, h);
  if (data.signatureBytes) {
    const sig = await embedFile(pdfDoc, data.signatureBytes);
    if (sig?.kind === "image") {
      const scale = Math.min((width - 10) / sig.width, (h - 10) / sig.height);
      page.drawImage(sig.image, {
        x: x + (width - sig.width * scale) / 2,
        y: top - h + (h - sig.height * scale) / 2,
        width: sig.width * scale,
        height: sig.height * scale,
      });
    }
  }
  text(page, "Unterschrift", x, top - h - 12, 8, fonts.font, GRAY);

  const dateTop = top - h - 36;
  box(page, x, dateTop - 28, width, 28);
  text(page, dateFmt(data.createdAt), x + 6, dateTop - 18, 9, fonts.font);
  text(page, "Datum", x, dateTop - 40, 8, fonts.font, GRAY);
}

function drawTotals(
  page: PDFPage,
  fonts: Fonts,
  data: ReimbursementData,
  x: number,
  top: number,
  totals: Totals,
) {
  const boxW = 80;
  const boxX = RIGHT - boxW;
  const rows: [string, number, boolean][] = [
    ["Gesamtbetrag netto", totals.net, true],
    ["USt 0 %", totals.tax0, false],
    ["USt 7 %", totals.tax7, false],
    ["USt 19 %", totals.tax19, false],
    ["Gesamtbetrag brutto", totals.gross, true],
  ];
  let y = top - 6;
  for (const [label, value, bold] of rows) {
    textRight(page, label, boxX - 6, y - 12, 8, bold ? fonts.bold : fonts.font);
    boxValue(page, fonts, boxX, y - 17, boxW, 16, eur(value), bold);
    y -= 22;
  }

  y -= 6;
  page.drawLine({
    start: { x, y },
    end: { x: RIGHT, y },
    thickness: 0.5,
    color: BORDER,
  });
  const noteW = RIGHT - x;
  y -= 16;
  text(
    page,
    fitText("Bitte die Rechnungen der Auslagen-", fonts.font, 8, noteW),
    x,
    y,
    8,
    fonts.font,
    RED,
  );
  y -= 10;
  text(page, "erstattung beifügen.", x, y, 8, fonts.font, RED);
  y -= 18;
  text(page, "Alles bitte als eine Datei an", x, y, 8, fonts.font);
  y -= 10;
  text(
    page,
    fitText(data.organization.accountingEmail, fonts.bold, 8, noteW),
    x,
    y,
    8,
    fonts.bold,
  );
  y -= 10;
  text(page, "senden.", x, y, 8, fonts.font);
}

export async function drawBottomSection(
  pdfDoc: PDFDocument,
  page: PDFPage,
  fonts: Fonts,
  top: number,
  data: ReimbursementData,
  totals: Totals,
) {
  const accountingW = 180;
  const middleX = M + accountingW + 16;
  const middleW = 132;
  drawAccountingBox(page, fonts, top, accountingW);
  await drawSignature(pdfDoc, page, fonts, data, middleX, top, middleW);
  drawTotals(page, fonts, data, middleX + middleW + 16, top, totals);
}
