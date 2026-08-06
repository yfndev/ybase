import {
  PDFDocument,
  type PDFFont,
  type PDFPage,
  StandardFonts,
  rgb,
} from "pdf-lib";
import { toPdfText } from "./documentText";

const PAGE_SIZE: [number, number] = [595.28, 841.89];
const MARGIN = 52;
const BOTTOM_MARGIN = 64;
const LINE_RATIO = 1.42;

export interface PdfWriter {
  document: PDFDocument;
  page: PDFPage;
  regular: PDFFont;
  bold: PDFFont;
  y: number;
}

export interface WriteOptions {
  size?: number;
  bold?: boolean;
  indent?: number;
  gap?: number;
}

export async function createPdfWriter(): Promise<PdfWriter> {
  const document = await PDFDocument.create();
  const [regular, bold] = await Promise.all([
    document.embedFont(StandardFonts.Helvetica),
    document.embedFont(StandardFonts.HelveticaBold),
  ]);
  return {
    document,
    page: document.addPage(PAGE_SIZE),
    regular,
    bold,
    y: PAGE_SIZE[1] - MARGIN,
  };
}

export function startPage(writer: PdfWriter): void {
  writer.page = writer.document.addPage(PAGE_SIZE);
  writer.y = PAGE_SIZE[1] - MARGIN;
}

export function writeText(
  writer: PdfWriter,
  text: string,
  options: WriteOptions = {},
): void {
  const size = options.size ?? 10;
  const font = options.bold ? writer.bold : writer.regular;
  const indent = options.indent ?? 0;
  const width = PAGE_SIZE[0] - MARGIN * 2 - indent;
  const lineHeight = size * LINE_RATIO;
  for (const line of wrapLines(toPdfText(text), font, size, width)) {
    if (writer.y - lineHeight < BOTTOM_MARGIN) startPage(writer);
    writer.y -= lineHeight;
    writer.page.drawText(line, {
      x: MARGIN + indent,
      y: writer.y,
      size,
      font,
      color: rgb(0.1, 0.11, 0.14),
    });
  }
  writer.y -= options.gap ?? size * 0.6;
}

export function writeGap(writer: PdfWriter, height: number): void {
  if (writer.y - height < BOTTOM_MARGIN) {
    startPage(writer);
    return;
  }
  writer.y -= height;
}

export async function drawSignatureImage(
  writer: PdfWriter,
  png: Uint8Array,
): Promise<void> {
  const image = await writer.document.embedPng(png);
  const scale = Math.min(240 / image.width, 90 / image.height, 1);
  const height = image.height * scale;
  if (writer.y - height < BOTTOM_MARGIN) startPage(writer);
  writer.y -= height;
  writer.page.drawImage(image, {
    x: MARGIN,
    y: writer.y,
    width: image.width * scale,
    height,
  });
  writer.y -= 8;
}

function wrapLines(
  text: string,
  font: PDFFont,
  size: number,
  width: number,
): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(" ").filter(Boolean)) {
    for (const part of splitLongWord(word, font, size, width)) {
      const candidate = current ? `${current} ${part}` : part;
      if (current && font.widthOfTextAtSize(candidate, size) > width) {
        lines.push(current);
        current = part;
      } else {
        current = candidate;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

function splitLongWord(
  word: string,
  font: PDFFont,
  size: number,
  width: number,
): string[] {
  if (font.widthOfTextAtSize(word, size) <= width) return [word];
  const parts: string[] = [];
  let current = "";
  for (const character of word) {
    if (current && font.widthOfTextAtSize(current + character, size) > width) {
      parts.push(current);
      current = character;
    } else {
      current += character;
    }
  }
  if (current) parts.push(current);
  return parts;
}
