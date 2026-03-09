import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const BLUE = rgb(0.118, 0.251, 0.686);
const LIGHT_GRAY = rgb(0.96, 0.96, 0.96);
const TEXT_DARK = rgb(0.13, 0.13, 0.13);
const TEXT_MUTED = rgb(0.45, 0.45, 0.45);

type VolunteerAllowanceData = {
  amount: number;
  iban: string;
  bic?: string;
  accountHolder: string;
  activityDescription: string;
  startDate: string;
  endDate: string;
  taxYear?: string;
  volunteerName: string;
  volunteerStreet: string;
  volunteerPlz: string;
  volunteerCity: string;
  projectName: string;
  organizationName: string;
  organizationStreet?: string;
  organizationPlz?: string;
  organizationCity?: string;
};

export async function generateVolunteerAllowancePDF(
  data: VolunteerAllowanceData,
  signatureUrl: string | null,
) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const WIDTH = 595;
  const HEIGHT = 842;
  const M = 40;

  const page = pdfDoc.addPage([WIDTH, HEIGHT]);

  // Blue header bar
  page.drawRectangle({ x: 0, y: 792, width: WIDTH, height: 50, color: BLUE });
  page.drawText("EHRENAMTSPAUSCHALE", {
    x: M,
    y: 808,
    size: 16,
    font: boldFont,
    color: rgb(1, 1, 1),
  });
  const orgTextWidth = boldFont.widthOfTextAtSize(data.organizationName, 10);
  page.drawText(data.organizationName, {
    x: WIDTH - orgTextWidth - M,
    y: 811,
    size: 10,
    font,
    color: rgb(0.85, 0.9, 1),
  });

  // Footer
  page.drawLine({
    start: { x: M, y: 30 },
    end: { x: WIDTH - M, y: 30 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  const dateStr = new Date().toLocaleDateString("de-DE");
  page.drawText(dateStr, { x: M, y: 16, size: 8, font, color: TEXT_MUTED });
  page.drawText("Gemäß § 3 Nr. 26a EStG", {
    x: WIDTH / 2 - 50,
    y: 16,
    size: 8,
    font,
    color: TEXT_MUTED,
  });

  let y = 755;

  // Helper functions
  const drawSection = (label: string) => {
    page.drawText(label, { x: M, y, size: 8, font: boldFont, color: BLUE });
    y -= 6;
    page.drawLine({
      start: { x: M, y },
      end: { x: WIDTH - M, y },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    });
    y -= 16;
  };

  const drawRow = (label: string, value: string, bold = false) => {
    page.drawText(label, { x: M, y, size: 9, font, color: TEXT_MUTED });
    page.drawText(value, {
      x: M + 150,
      y,
      size: 9,
      font: bold ? boldFont : font,
      color: TEXT_DARK,
    });
    y -= 15;
  };

  // Person info + amount summary box
  page.drawRectangle({
    x: M,
    y: y - 10,
    width: WIDTH - 2 * M,
    height: 52,
    color: LIGHT_GRAY,
    borderColor: rgb(0.88, 0.88, 0.88),
    borderWidth: 0.5,
  });
  page.drawText(data.volunteerName, {
    x: M + 12,
    y: y + 26,
    size: 13,
    font: boldFont,
    color: TEXT_DARK,
  });
  page.drawText(`${data.amount.toFixed(2)} Euro`, {
    x: M + 12,
    y: y + 8,
    size: 11,
    font: boldFont,
    color: BLUE,
  });
  if (data.taxYear) {
    page.drawText(`Steuerjahr ${data.taxYear}`, {
      x: WIDTH - M - 100,
      y: y + 17,
      size: 9,
      font,
      color: TEXT_MUTED,
    });
  }
  y -= 40;

  // Ehrenamtliche/r
  y -= 12;
  drawSection("EHRENAMTLICHE/R");
  drawRow("Name", data.volunteerName);
  drawRow("Straße", data.volunteerStreet);
  drawRow("PLZ / Ort", `${data.volunteerPlz} ${data.volunteerCity}`);

  // Verein
  y -= 4;
  drawSection("VEREIN");
  drawRow("Name", data.organizationName);
  if (data.organizationStreet) drawRow("Straße", data.organizationStreet);
  if (data.organizationPlz || data.organizationCity) {
    drawRow("PLZ / Ort", `${data.organizationPlz ?? ""} ${data.organizationCity ?? ""}`.trim());
  }
  drawRow("Projekt", data.projectName);

  // Tätigkeit
  y -= 4;
  drawSection("TÄTIGKEIT");
  const activityLines = splitText(data.activityDescription, 72);
  for (const line of activityLines) {
    page.drawText(line, { x: M, y, size: 9, font, color: TEXT_DARK });
    y -= 14;
  }
  y -= 2;
  drawRow("Zeitraum", `${formatDate(data.startDate)} bis ${formatDate(data.endDate)}`);

  // Betrag + Bankverbindung
  y -= 4;
  drawSection("BANKVERBINDUNG");
  drawRow("Kontoinhaber", data.accountHolder);
  drawRow("IBAN", data.iban);
  if (data.bic) drawRow("BIC", data.bic);

  // Legal confirmation
  y -= 8;
  drawSection("BESTÄTIGUNG GEMÄSS § 3 NR. 26A ESTG");
  const confirmText =
    `Ich erkläre, dass ich die Steuerbefreiung nach § 3 Nr. 26a EStG für nebenberufliche ` +
    `ehrenamtliche Tätigkeit in Höhe von ${data.amount.toFixed(2)} Euro in Anspruch nehmen kann. ` +
    `Sollte sich im Laufe des Jahres eine Änderung ergeben, werde ich dies umgehend mitteilen.`;
  for (const line of splitText(confirmText, 85)) {
    page.drawText(line, { x: M, y, size: 8.5, font, color: TEXT_DARK });
    y -= 13;
  }

  // Signature area
  y -= 20;

  if (signatureUrl) {
    try {
      const response = await fetch(signatureUrl);
      const bytes = new Uint8Array(await response.arrayBuffer());
      const image = await pdfDoc.embedPng(bytes);
      const scale = Math.min(180 / image.width, 55 / image.height);
      page.drawImage(image, {
        x: M,
        y: y - image.height * scale,
        width: image.width * scale,
        height: image.height * scale,
      });
      y -= image.height * scale + 8;
    } catch (error) {
      console.error("Failed to embed signature:", error);
    }
  }

  page.drawLine({
    start: { x: M, y },
    end: { x: M + 220, y },
    thickness: 0.5,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 14;
  page.drawText("Unterschrift Ehrenamtliche/r", { x: M, y, size: 8.5, font, color: TEXT_MUTED });

  // Org signature line (right side)
  const rightX = WIDTH / 2 + 20;
  page.drawLine({
    start: { x: rightX, y: y + 14 },
    end: { x: rightX + 220, y: y + 14 },
    thickness: 0.5,
    color: rgb(0.3, 0.3, 0.3),
  });
  page.drawText("Unterschrift Vorstand / Verein", {
    x: rightX,
    y,
    size: 8.5,
    font,
    color: TEXT_MUTED,
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
}

function splitText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length <= maxChars) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("de-DE");
}
