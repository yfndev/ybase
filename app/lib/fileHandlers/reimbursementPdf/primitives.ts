import {
  PDFDocument,
  type PDFEmbeddedPage,
  type PDFFont,
  type PDFImage,
  type PDFPage,
  rgb,
} from "pdf-lib";

export const BLACK = rgb(0.1, 0.1, 0.1);
export const GRAY = rgb(0.45, 0.45, 0.45);
export const RED = rgb(0.78, 0.1, 0.1);
export const LIGHT_GRAY = rgb(0.93, 0.93, 0.93);
export const BORDER = rgb(0.3, 0.3, 0.3);

export const WIDTH = 595;
export const HEIGHT = 842;
export const M = 36;
export const RIGHT = WIDTH - M;

export type Fonts = { font: PDFFont; bold: PDFFont };

const eurFmt = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export const eur = (n: number) => eurFmt.format(n || 0).replace(/ /g, " ");

export function dateFmt(value?: number | string) {
  if (value === undefined || value === "") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("de-DE");
}

export function fitText(
  value: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
) {
  if (!value) return "";
  if (font.widthOfTextAtSize(value, size) <= maxWidth) return value;
  let cut = value;
  while (
    cut.length > 1 &&
    font.widthOfTextAtSize(`${cut}...`, size) > maxWidth
  ) {
    cut = cut.slice(0, -1);
  }
  return `${cut}...`;
}

export function text(
  page: PDFPage,
  value: string,
  x: number,
  y: number,
  size: number,
  font: PDFFont,
  color = BLACK,
) {
  page.drawText(value, { x, y, size, font, color });
}

export function textRight(
  page: PDFPage,
  value: string,
  rightX: number,
  y: number,
  size: number,
  font: PDFFont,
  color = BLACK,
) {
  const w = font.widthOfTextAtSize(value, size);
  page.drawText(value, { x: rightX - w, y, size, font, color });
}

export function box(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  fill?: ReturnType<typeof rgb>,
) {
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    color: fill,
    borderColor: BORDER,
    borderWidth: 0.75,
  });
}

export function boxValue(
  page: PDFPage,
  fonts: Fonts,
  x: number,
  y: number,
  w: number,
  h: number,
  value: string,
  bold = false,
) {
  box(page, x, y, w, h);
  if (!value) return;
  const font = bold ? fonts.bold : fonts.font;
  let size = 9;
  while (size > 6.5 && font.widthOfTextAtSize(value, size) > w - 8) size -= 0.5;
  const shown = fitText(value, font, size, w - 8);
  text(page, shown, x + 4, y + (h - size) / 2 + 0.5, size, font);
}

export type EmbedResult =
  | { kind: "pdf"; draw: PDFEmbeddedPage; width: number; height: number }
  | { kind: "image"; image: PDFImage; width: number; height: number }
  | null;

export async function embedFile(
  pdfDoc: PDFDocument,
  bytes: Uint8Array,
): Promise<EmbedResult> {
  try {
    const pdf = await PDFDocument.load(bytes);
    const [page] = await pdfDoc.embedPdf(pdf, [0]);
    return { kind: "pdf", draw: page, width: page.width, height: page.height };
  } catch {}
  try {
    const image = await pdfDoc.embedJpg(bytes);
    return { kind: "image", image, width: image.width, height: image.height };
  } catch {}
  try {
    const image = await pdfDoc.embedPng(bytes);
    return { kind: "image", image, width: image.width, height: image.height };
  } catch {}
  return null;
}

export async function fetchBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}
