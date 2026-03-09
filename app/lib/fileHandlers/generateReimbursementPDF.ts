import {
  PDFDocument,
  type PDFEmbeddedPage,
  type PDFImage,
  rgb,
  StandardFonts,
} from "pdf-lib";

const BLUE = rgb(0.118, 0.251, 0.686); // #1e40af
const LIGHT_GRAY = rgb(0.96, 0.96, 0.96);
const TEXT_DARK = rgb(0.13, 0.13, 0.13);
const TEXT_MUTED = rgb(0.45, 0.45, 0.45);

type EmbedResult =
  | { draw: PDFEmbeddedPage; width: number; height: number }
  | { image: PDFImage; width: number; height: number }
  | null;

async function embedFile(
  pdfDoc: PDFDocument,
  bytes: Uint8Array,
): Promise<EmbedResult> {
  try {
    const pdf = await PDFDocument.load(bytes);
    const [page] = await pdfDoc.embedPdf(pdf, [0]);
    return { draw: page, width: page.width, height: page.height };
  } catch {}

  try {
    const image = await pdfDoc.embedJpg(bytes);
    return { image, width: image.width, height: image.height };
  } catch {}

  try {
    const image = await pdfDoc.embedPng(bytes);
    return { image, width: image.width, height: image.height };
  } catch {}

  return null;
}

function drawHeader(
  page: ReturnType<PDFDocument["addPage"]>,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  boldFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  title: string,
  orgName: string,
  width: number,
) {
  // Blue header bar
  page.drawRectangle({
    x: 0,
    y: 792,
    width,
    height: 50,
    color: BLUE,
  });
  page.drawText(title, {
    x: 40,
    y: 808,
    size: 16,
    font: boldFont,
    color: rgb(1, 1, 1),
  });
  if (orgName) {
    const orgTextWidth = boldFont.widthOfTextAtSize(orgName, 10);
    page.drawText(orgName, {
      x: width - orgTextWidth - 40,
      y: 811,
      size: 10,
      font,
      color: rgb(0.85, 0.9, 1),
    });
  }
}

function drawFooter(
  page: ReturnType<PDFDocument["addPage"]>,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  pageNum: number,
  totalPages: number,
  width: number,
) {
  page.drawLine({
    start: { x: 40, y: 30 },
    end: { x: width - 40, y: 30 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  const dateStr = new Date().toLocaleDateString("de-DE");
  page.drawText(dateStr, { x: 40, y: 16, size: 8, font, color: TEXT_MUTED });
  const pageStr = `Seite ${pageNum} von ${totalPages}`;
  const pageStrWidth = font.widthOfTextAtSize(pageStr, 8);
  page.drawText(pageStr, {
    x: width - pageStrWidth - 40,
    y: 16,
    size: 8,
    font,
    color: TEXT_MUTED,
  });
}

function drawDivider(
  page: ReturnType<PDFDocument["addPage"]>,
  y: number,
  width: number,
) {
  page.drawLine({
    start: { x: 40, y },
    end: { x: width - 40, y },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });
}

function drawLabelValue(
  page: ReturnType<PDFDocument["addPage"]>,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  boldFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  label: string,
  value: string,
  x: number,
  y: number,
  labelWidth = 140,
) {
  page.drawText(label, { x, y, size: 9, font, color: TEXT_MUTED });
  page.drawText(value, {
    x: x + labelWidth,
    y,
    size: 9,
    font: boldFont,
    color: TEXT_DARK,
  });
}

export async function generateReimbursementPDF(
  reimbursement: any,
  receipts: any[] = [],
) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const WIDTH = 595;
  const HEIGHT = 842;
  const M = 40;
  const orgName: string = reimbursement.organizationName ?? "";
  const isTravel = reimbursement.type === "travel";
  const title = isTravel ? "REISEKOSTENERSTATTUNG" : "AUSLAGENERSTATTUNG";
  const totalPages = 1 + receipts.length;

  // ── Cover page ──────────────────────────────────────────────────────────
  const coverPage = pdfDoc.addPage([WIDTH, HEIGHT]);
  drawHeader(coverPage, font, boldFont, title, orgName, WIDTH);
  drawFooter(coverPage, font, 1, totalPages, WIDTH);

  let y = 730;

  // Name + amount box
  coverPage.drawRectangle({
    x: M,
    y: y - 10,
    width: WIDTH - 2 * M,
    height: 56,
    color: LIGHT_GRAY,
    borderColor: rgb(0.88, 0.88, 0.88),
    borderWidth: 0.5,
  });
  coverPage.drawText(reimbursement.accountHolder, {
    x: M + 12,
    y: y + 24,
    size: 14,
    font: boldFont,
    color: TEXT_DARK,
  });
  coverPage.drawText(`Gesamtbetrag: ${reimbursement.amount.toFixed(2)} €`, {
    x: M + 12,
    y: y + 6,
    size: 11,
    font: boldFont,
    color: BLUE,
  });
  y -= 36;

  // Section: Bankverbindung
  y -= 24;
  coverPage.drawText("BANKVERBINDUNG", {
    x: M,
    y,
    size: 8,
    font: boldFont,
    color: BLUE,
  });
  y -= 6;
  drawDivider(coverPage, y, WIDTH);
  y -= 18;
  drawLabelValue(coverPage, font, boldFont, "IBAN", reimbursement.iban, M, y);
  y -= 16;
  if (reimbursement.bic) {
    drawLabelValue(coverPage, font, boldFont, "BIC", reimbursement.bic, M, y);
    y -= 16;
  }

  // Section: Belege summary
  let totalNet = 0;
  let totalGross = 0;
  for (const r of receipts) {
    totalNet += r.netAmount || 0;
    totalGross += r.grossAmount || 0;
  }

  const taxByRate = (rate: number) =>
    receipts
      .filter((r: any) => r.taxRate === rate)
      .reduce((sum: number, r: any) => sum + (r.grossAmount || 0) - (r.netAmount || 0), 0);

  const tax7 = taxByRate(7);
  const tax19 = taxByRate(19);

  y -= 20;
  coverPage.drawText("BELEGÜBERSICHT", {
    x: M,
    y,
    size: 8,
    font: boldFont,
    color: BLUE,
  });
  y -= 6;
  drawDivider(coverPage, y, WIDTH);
  y -= 18;
  drawLabelValue(coverPage, font, boldFont, "Anzahl Belege", `${receipts.length}`, M, y);
  y -= 16;
  drawLabelValue(coverPage, font, boldFont, "Nettobetrag", `${totalNet.toFixed(2)} €`, M, y);
  if (tax7 > 0) {
    y -= 16;
    drawLabelValue(coverPage, font, boldFont, "MwSt. 7%", `${tax7.toFixed(2)} €`, M, y);
  }
  if (tax19 > 0) {
    y -= 16;
    drawLabelValue(coverPage, font, boldFont, "MwSt. 19%", `${tax19.toFixed(2)} €`, M, y);
  }
  y -= 16;
  drawLabelValue(coverPage, font, boldFont, "Bruttobetrag", `${totalGross.toFixed(2)} €`, M, y);

  // Travel details if applicable
  if (isTravel && reimbursement.travelDetails) {
    const td = reimbursement.travelDetails;
    y -= 28;
    coverPage.drawText("REISEDETAILS", {
      x: M,
      y,
      size: 8,
      font: boldFont,
      color: BLUE,
    });
    y -= 6;
    drawDivider(coverPage, y, WIDTH);
    y -= 18;
    drawLabelValue(coverPage, font, boldFont, "Reiseziel", td.destination || "", M, y);
    y -= 16;
    drawLabelValue(coverPage, font, boldFont, "Zweck", td.purpose || "", M, y);
    y -= 16;
    drawLabelValue(
      coverPage,
      font,
      boldFont,
      "Zeitraum",
      `${td.startDate} – ${td.endDate}`,
      M,
      y,
    );
    if (td.mealAllowanceDays) {
      y -= 16;
      drawLabelValue(
        coverPage,
        font,
        boldFont,
        "Verpflegungspauschale",
        `${td.mealAllowanceDays} Tage × ${td.mealAllowanceDailyBudget?.toFixed(2) ?? "0.00"} €`,
        M,
        y,
      );
    }
  }

  // ── Receipt pages ────────────────────────────────────────────────────────
  for (let i = 0; i < receipts.length; i++) {
    const r = receipts[i];
    const page = pdfDoc.addPage([WIDTH, HEIGHT]);
    drawHeader(page, font, boldFont, `BELEG ${i + 1}`, orgName, WIDTH);
    drawFooter(page, font, i + 2, totalPages, WIDTH);

    let ry = 730;

    // Receipt header band
    page.drawRectangle({
      x: M,
      y: ry - 10,
      width: WIDTH - 2 * M,
      height: 44,
      color: LIGHT_GRAY,
      borderColor: rgb(0.88, 0.88, 0.88),
      borderWidth: 0.5,
    });
    page.drawText(r.companyName || "", {
      x: M + 12,
      y: ry + 18,
      size: 12,
      font: boldFont,
      color: TEXT_DARK,
    });
    page.drawText(r.description || "", {
      x: M + 12,
      y: ry + 3,
      size: 9,
      font,
      color: TEXT_MUTED,
    });
    ry -= 26;

    ry -= 20;
    page.drawText("BELEGDETAILS", { x: M, y: ry, size: 8, font: boldFont, color: BLUE });
    ry -= 6;
    drawDivider(page, ry, WIDTH);
    ry -= 18;
    drawLabelValue(page, font, boldFont, "Datum", r.receiptDate || "", M, ry);
    if (r.receiptNumber) {
      ry -= 16;
      drawLabelValue(page, font, boldFont, "Beleg-Nr.", r.receiptNumber, M, ry);
    }
    ry -= 16;
    drawLabelValue(page, font, boldFont, "Netto", `${(r.netAmount || 0).toFixed(2)} €`, M, ry);
    ry -= 16;
    const taxAmt = ((r.grossAmount || 0) - (r.netAmount || 0)).toFixed(2);
    drawLabelValue(page, font, boldFont, `MwSt. (${r.taxRate || 0}%)`, `${taxAmt} €`, M, ry);
    ry -= 16;
    drawLabelValue(page, font, boldFont, "Brutto", `${(r.grossAmount || 0).toFixed(2)} €`, M, ry);

    if (!r.fileUrl) continue;

    ry -= 24;
    const imageHeight = ry - 50;

    try {
      const res = await fetch(r.fileUrl);
      const bytes = new Uint8Array(await res.arrayBuffer());
      const maxWidth = WIDTH - 2 * M;

      const embedded = await embedFile(pdfDoc, bytes);
      if (!embedded) continue;

      const scale = Math.min(maxWidth / embedded.width, imageHeight / embedded.height);

      if ("draw" in embedded) {
        page.drawPage(embedded.draw, { x: M, y: 50, xScale: scale, yScale: scale });
      } else {
        page.drawImage(embedded.image, {
          x: M,
          y: 50,
          width: embedded.width * scale,
          height: embedded.height * scale,
        });
      }
    } catch (error) {
      console.error(`Failed to embed receipt file for beleg ${i + 1}:`, error);
    }
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
}
