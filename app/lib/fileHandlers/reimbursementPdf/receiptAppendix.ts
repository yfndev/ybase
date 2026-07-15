import { PDFDocument, type PDFEmbeddedPage, type PDFImage } from "pdf-lib";
import type { ReceiptInput } from "./data";
import { type Fonts, fetchBytes, HEIGHT, M, text, WIDTH } from "./primitives";

type Drawable =
  | { kind: "pdf"; value: PDFEmbeddedPage }
  | { kind: "image"; value: PDFImage };

async function embedReceipt(
  pdfDoc: PDFDocument,
  bytes: Uint8Array,
): Promise<Drawable[]> {
  try {
    const source = await PDFDocument.load(bytes);
    const pages = await pdfDoc.embedPdf(source, source.getPageIndices());
    return pages.map((value) => ({ kind: "pdf" as const, value }));
  } catch {}

  try {
    return [{ kind: "image", value: await pdfDoc.embedJpg(bytes) }];
  } catch {}

  try {
    return [{ kind: "image", value: await pdfDoc.embedPng(bytes) }];
  } catch {}

  return [];
}

function drawReceipt(
  pdfDoc: PDFDocument,
  fonts: Fonts,
  receipt: ReceiptInput,
  receiptIndex: number,
  drawable: Drawable,
  pageIndex: number,
  pageCount: number,
) {
  const page = pdfDoc.addPage([WIDTH, HEIGHT]);
  const pageSuffix =
    pageCount > 1 ? `, Seite ${pageIndex + 1}/${pageCount}` : "";
  const label = `Beleg ${receipt.receiptNumber || receiptIndex + 1}${pageSuffix}: ${receipt.companyName || ""}`;
  text(page, label, M, HEIGHT - 40, 11, fonts.bold);

  const width = drawable.value.width;
  const height = drawable.value.height;
  const scale = Math.min((WIDTH - 2 * M) / width, (HEIGHT - 90) / height, 1);
  const targetWidth = width * scale;
  const targetHeight = height * scale;
  const x = (WIDTH - targetWidth) / 2;
  const y = HEIGHT - 60 - targetHeight;

  if (drawable.kind === "pdf") {
    page.drawPage(drawable.value, {
      x,
      y,
      xScale: scale,
      yScale: scale,
    });
    return;
  }

  page.drawImage(drawable.value, {
    x,
    y,
    width: targetWidth,
    height: targetHeight,
  });
}

export async function appendReceiptPages(
  pdfDoc: PDFDocument,
  fonts: Fonts,
  receipts: ReceiptInput[],
) {
  for (let receiptIndex = 0; receiptIndex < receipts.length; receiptIndex++) {
    const receipt = receipts[receiptIndex];
    const bytes = receipt.fileUrl ? await fetchBytes(receipt.fileUrl) : null;
    if (!bytes) continue;

    const drawables = await embedReceipt(pdfDoc, bytes);
    for (let pageIndex = 0; pageIndex < drawables.length; pageIndex++) {
      drawReceipt(
        pdfDoc,
        fonts,
        receipt,
        receiptIndex,
        drawables[pageIndex],
        pageIndex,
        drawables.length,
      );
    }
  }
}
