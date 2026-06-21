import type { PDFImage, PDFPage } from "pdf-lib";
import type { ReimbursementData } from "./data";
import {
  BORDER,
  box,
  boxValue,
  dateFmt,
  eur,
  type Fonts,
  fitText,
  GRAY,
  HEIGHT,
  M,
  RED,
  RIGHT,
  text,
  textRight,
  WIDTH,
} from "./primitives";

export function drawHeader(
  page: PDFPage,
  fonts: Fonts,
  title: string,
  logo: PDFImage | null,
) {
  text(page, title, M, HEIGHT - 48, 16, fonts.bold);
  if (!logo) {
    textRight(
      page,
      "YOUNG FOUNDERS NETWORK",
      RIGHT,
      HEIGHT - 40,
      11,
      fonts.bold,
    );
    return;
  }
  const h = 30;
  const w = (logo.width / logo.height) * h;
  page.drawImage(logo, { x: RIGHT - w, y: HEIGHT - 50, width: w, height: h });
}

function drawLeftColumn(
  page: PDFPage,
  fonts: Fonts,
  data: ReimbursementData,
  top: number,
  valueW: number,
) {
  const org = data.organization;
  const labelX = M + 12;
  const valueX = M + 96;
  const rows: [string, string][] = [
    ["Firma:", org.name],
    ["", org.careOf],
    ["Straße:", org.street],
    ["Postleitzahl:", org.plz],
    ["Ort:", org.city],
    ["USt-ID:", org.taxId],
  ];
  let y = top - 18;
  for (const [label, value] of rows) {
    if (label) text(page, label, labelX, y, 9, fonts.bold, GRAY);
    if (value)
      text(
        page,
        fitText(value, fonts.font, 9, valueW),
        valueX,
        y,
        9,
        fonts.font,
      );
    y -= 18;
  }
  y -= 6;
  text(page, "Datum:", labelX, y, 9, fonts.bold, GRAY);
  text(page, dateFmt(data.createdAt), valueX, y, 9, fonts.font);
}

function drawBankColumn(
  page: PDFPage,
  fonts: Fonts,
  data: ReimbursementData,
  top: number,
  split: number,
) {
  const labelX = split + 12;
  const bx = split + 96;
  const bw = RIGHT - bx - 10;

  text(page, "Erstattungsbetrag:", labelX, top - 18, 9, fonts.bold, GRAY);
  boxValue(page, fonts, bx, top - 32, bw, 18, eur(data.amount), true);

  text(page, "Erstattung per:", labelX, top - 54, 9, fonts.bold, GRAY);
  text(page, "Überweisung", bx, top - 54, 11, fonts.font);

  text(
    page,
    "Bitte erstatten Sie den Betrag an folgendes Konto",
    labelX,
    top - 74,
    8,
    fonts.bold,
  );

  const rows: [string, string][] = [
    ["Kontoinhaber:", data.accountHolder],
    ["IBAN:", data.iban],
    ["BIC:", data.bic ?? ""],
    ["Bankname:", ""],
  ];
  let y = top - 96;
  for (const [label, value] of rows) {
    text(page, label, labelX, y, 9, fonts.bold, GRAY);
    boxValue(page, fonts, bx, y - 4, bw, 15, value);
    y -= 22;
  }
}

export function drawAddressBlock(
  page: PDFPage,
  fonts: Fonts,
  data: ReimbursementData,
): number {
  text(
    page,
    "BITTE NUR IN MASCHINENSCHRIFT AUSFÜLLEN!",
    M,
    HEIGHT - 74,
    9,
    fonts.bold,
    RED,
  );

  const top = HEIGHT - 92;
  const bottom = top - 168;
  const split = M + 282;

  box(page, M, bottom, WIDTH - 2 * M, top - bottom);
  page.drawLine({
    start: { x: split, y: top },
    end: { x: split, y: bottom },
    thickness: 0.75,
    color: BORDER,
  });

  drawLeftColumn(page, fonts, data, top, split - (M + 96) - 8);
  drawBankColumn(page, fonts, data, top, split);

  return bottom - 16;
}
