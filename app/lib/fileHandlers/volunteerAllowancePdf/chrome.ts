import type { PDFPage } from "pdf-lib";
import { rgb } from "pdf-lib";
import type { Fonts } from "../reimbursementPdf/primitives";
import { text, textRight, WIDTH } from "../reimbursementPdf/primitives";
import {
  BLUE,
  M,
  TEXT_MUTED,
  WHITE,
  type VolunteerAllowanceData,
} from "./data";

export function drawHeader(
  page: PDFPage,
  fonts: Fonts,
  data: VolunteerAllowanceData,
) {
  page.drawRectangle({ x: 0, y: 792, width: WIDTH, height: 50, color: BLUE });
  text(page, "EHRENAMTSPAUSCHALE", M, 808, 16, fonts.bold, WHITE);
  const orgWidth = fonts.bold.widthOfTextAtSize(data.organizationName, 10);
  text(
    page,
    data.organizationName,
    WIDTH - orgWidth - M,
    811,
    10,
    fonts.font,
    rgb(0.85, 0.9, 1),
  );
  if (data.id) {
    textRight(
      page,
      `Ref: ${data.id}`,
      WIDTH - M,
      797,
      8,
      fonts.font,
      rgb(0.7, 0.8, 1),
    );
  }
}

export function drawFooter(page: PDFPage, fonts: Fonts) {
  page.drawLine({
    start: { x: M, y: 30 },
    end: { x: WIDTH - M, y: 30 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  const dateStr = new Date().toLocaleDateString("de-DE");
  text(page, dateStr, M, 16, 8, fonts.font, TEXT_MUTED);
  text(
    page,
    "Gemäß § 3 Nr. 26a EStG",
    WIDTH / 2 - 50,
    16,
    8,
    fonts.font,
    TEXT_MUTED,
  );
}
