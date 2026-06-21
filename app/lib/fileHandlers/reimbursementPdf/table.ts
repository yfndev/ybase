import type { PDFPage } from "pdf-lib";
import type { LineItem } from "./data";
import {
  BORDER,
  eur,
  type Fonts,
  fitText,
  LIGHT_GRAY,
  M,
  RIGHT,
  text,
  textRight,
  WIDTH,
} from "./primitives";

export const ROW_H = 16;

type Column = { title: string; w: number; align: "left" | "right" };

const COLUMNS: Column[] = [
  { title: "Beleg NR.", w: 42, align: "left" },
  { title: "Belegdatum", w: 58, align: "left" },
  { title: "Name / Firma", w: 92, align: "left" },
  { title: "Beschreibung", w: 131, align: "left" },
  { title: "Nettobetrag", w: 60, align: "right" },
  { title: "USt 7%", w: 40, align: "right" },
  { title: "USt 19%", w: 40, align: "right" },
  { title: "Bruttobetrag", w: 60, align: "right" },
];

const COL_X = (() => {
  const xs: number[] = [];
  let x = M;
  for (const col of COLUMNS) {
    xs.push(x);
    x += col.w;
  }
  return xs;
})();

function drawBorders(page: PDFPage, top: number) {
  const bottom = top - ROW_H;
  for (let i = 0; i <= COLUMNS.length; i++) {
    const x = i < COLUMNS.length ? COL_X[i] : RIGHT;
    page.drawLine({
      start: { x, y: top },
      end: { x, y: bottom },
      thickness: 0.5,
      color: BORDER,
    });
  }
  page.drawLine({
    start: { x: M, y: bottom },
    end: { x: RIGHT, y: bottom },
    thickness: 0.5,
    color: BORDER,
  });
}

export function drawTableHeader(
  page: PDFPage,
  fonts: Fonts,
  top: number,
): number {
  page.drawRectangle({
    x: M,
    y: top - ROW_H,
    width: WIDTH - 2 * M,
    height: ROW_H,
    color: LIGHT_GRAY,
  });
  page.drawLine({
    start: { x: M, y: top },
    end: { x: RIGHT, y: top },
    thickness: 0.5,
    color: BORDER,
  });
  COLUMNS.forEach((col, i) => {
    text(page, col.title, COL_X[i] + 4, top - 11, 7.5, fonts.bold);
  });
  drawBorders(page, top);
  return top - ROW_H;
}

export function drawTableRow(
  page: PDFPage,
  fonts: Fonts,
  item: LineItem,
  top: number,
) {
  const baseY = top - 11;
  const cell = (i: number, value: string) => {
    if (!value) return;
    const col = COLUMNS[i];
    const safe = fitText(value, fonts.font, 8, col.w - 6);
    if (col.align === "right") {
      textRight(page, safe, COL_X[i] + col.w - 4, baseY, 8, fonts.font);
    } else {
      text(page, safe, COL_X[i] + 4, baseY, 8, fonts.font);
    }
  };
  cell(0, item.nr);
  cell(1, item.date);
  cell(2, item.company);
  cell(3, item.description);
  cell(4, eur(item.net));
  cell(5, item.tax7 ? eur(item.tax7) : "");
  cell(6, item.tax19 ? eur(item.tax19) : "");
  cell(7, eur(item.gross));
  drawBorders(page, top);
}
