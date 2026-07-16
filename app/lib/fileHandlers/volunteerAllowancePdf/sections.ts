import type { PDFPage } from "pdf-lib";
import { rgb } from "pdf-lib";
import type { Fonts } from "../reimbursementPdf/primitives";
import { text, WIDTH } from "../reimbursementPdf/primitives";
import {
  BLUE,
  LIGHT_GRAY,
  M,
  TEXT_DARK,
  TEXT_MUTED,
  type VolunteerAllowanceData,
  formatDate,
  splitText,
} from "./data";

export type Cursor = { y: number };

const LINE_GRAY = rgb(0.85, 0.85, 0.85);

export function drawSection(
  page: PDFPage,
  fonts: Fonts,
  cursor: Cursor,
  label: string,
) {
  text(page, label, M, cursor.y, 8, fonts.bold, BLUE);
  cursor.y -= 6;
  page.drawLine({
    start: { x: M, y: cursor.y },
    end: { x: WIDTH - M, y: cursor.y },
    thickness: 0.5,
    color: LINE_GRAY,
  });
  cursor.y -= 16;
}

export function drawRow(
  page: PDFPage,
  fonts: Fonts,
  cursor: Cursor,
  label: string,
  value: string,
  bold = false,
) {
  text(page, label, M, cursor.y, 9, fonts.font, TEXT_MUTED);
  text(
    page,
    value,
    M + 150,
    cursor.y,
    9,
    bold ? fonts.bold : fonts.font,
    TEXT_DARK,
  );
  cursor.y -= 15;
}

function drawSummaryBox(
  page: PDFPage,
  fonts: Fonts,
  cursor: Cursor,
  data: VolunteerAllowanceData,
) {
  page.drawRectangle({
    x: M,
    y: cursor.y - 10,
    width: WIDTH - 2 * M,
    height: 52,
    color: LIGHT_GRAY,
    borderColor: rgb(0.88, 0.88, 0.88),
    borderWidth: 0.5,
  });
  text(
    page,
    data.volunteerName,
    M + 12,
    cursor.y + 26,
    13,
    fonts.bold,
    TEXT_DARK,
  );
  text(
    page,
    `${data.amount.toFixed(2)} Euro`,
    M + 12,
    cursor.y + 8,
    11,
    fonts.bold,
    BLUE,
  );
  if (data.taxYear) {
    text(
      page,
      `Steuerjahr ${data.taxYear}`,
      WIDTH - M - 100,
      cursor.y + 17,
      9,
      fonts.font,
      TEXT_MUTED,
    );
  }
  cursor.y -= 40;
}

function drawTextLines(
  page: PDFPage,
  fonts: Fonts,
  cursor: Cursor,
  value: string,
  maxChars: number,
  size: number,
  lineHeight: number,
) {
  for (const line of splitText(value, maxChars)) {
    text(page, line, M, cursor.y, size, fonts.font, TEXT_DARK);
    cursor.y -= lineHeight;
  }
}

export function drawBody(
  page: PDFPage,
  fonts: Fonts,
  cursor: Cursor,
  data: VolunteerAllowanceData,
) {
  drawSummaryBox(page, fonts, cursor, data);

  cursor.y -= 12;
  drawSection(page, fonts, cursor, "EHRENAMTLICHE/R");
  drawRow(page, fonts, cursor, "Name", data.volunteerName);
  drawRow(page, fonts, cursor, "Straße", data.volunteerStreet);
  drawRow(
    page,
    fonts,
    cursor,
    "PLZ / Ort",
    `${data.volunteerPlz} ${data.volunteerCity}`,
  );

  cursor.y -= 4;
  drawSection(page, fonts, cursor, "VEREIN");
  drawRow(page, fonts, cursor, "Name", data.organizationName);
  if (data.organizationStreet) {
    drawRow(page, fonts, cursor, "Straße", data.organizationStreet);
  }
  if (data.organizationPlz || data.organizationCity) {
    drawRow(
      page,
      fonts,
      cursor,
      "PLZ / Ort",
      `${data.organizationPlz ?? ""} ${data.organizationCity ?? ""}`.trim(),
    );
  }
  drawRow(page, fonts, cursor, "Projekt", data.projectName);

  cursor.y -= 4;
  drawSection(page, fonts, cursor, "TÄTIGKEIT");
  drawTextLines(page, fonts, cursor, data.activityDescription, 72, 9, 14);
  cursor.y -= 2;
  drawRow(
    page,
    fonts,
    cursor,
    "Zeitraum",
    `${formatDate(data.startDate)} bis ${formatDate(data.endDate)}`,
  );

  cursor.y -= 4;
  drawSection(page, fonts, cursor, "BANKVERBINDUNG");
  drawRow(page, fonts, cursor, "Kontoinhaber", data.accountHolder);
  drawRow(page, fonts, cursor, "IBAN", data.iban);
  if (data.bic) drawRow(page, fonts, cursor, "BIC", data.bic);

  cursor.y -= 8;
  drawSection(page, fonts, cursor, "BESTÄTIGUNG GEMÄSS § 3 NR. 26A ESTG");
  const confirmText =
    `Ich erkläre, dass ich die Steuerbefreiung nach § 3 Nr. 26a EStG für nebenberufliche ` +
    `ehrenamtliche Tätigkeit in Höhe von ${data.amount.toFixed(2)} Euro in Anspruch nehmen kann. ` +
    `Sollte sich im Laufe des Jahres eine Änderung ergeben, werde ich dies umgehend mitteilen.`;
  drawTextLines(page, fonts, cursor, confirmText, 85, 8.5, 13);

  const isApproved = data.status === "approved" || data.status === "paid";
  if (isApproved && data.reviewedByName) {
    cursor.y -= 8;
    drawSection(page, fonts, cursor, "GENEHMIGUNG");
    drawRow(page, fonts, cursor, "Freigegeben von", data.reviewedByName, true);
    if (data.reviewedAt) {
      drawRow(
        page,
        fonts,
        cursor,
        "Freigabedatum",
        new Date(data.reviewedAt).toLocaleDateString("de-DE"),
      );
    }
  }
}
