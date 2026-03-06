import { PDFDocument, StandardFonts } from "pdf-lib";

type VolunteerAllowanceData = {
  amount: number;
  iban: string;
  bic?: string;
  accountHolder: string;
  activityDescription: string;
  startDate: string;
  endDate: string;
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
  const MARGIN = 50;

  const page = pdfDoc.addPage([WIDTH, HEIGHT]);
  let yPos = HEIGHT - MARGIN;

  page.drawText("ABRECHNUNG EHRENAMTSPAUSCHALE", {
    x: MARGIN,
    y: yPos,
    size: 18,
    font: boldFont,
  });
  yPos -= 50;

  page.drawText("Ehrenamtliche/r:", {
    x: MARGIN,
    y: yPos,
    size: 10,
    font: boldFont,
  });
  yPos -= 18;
  page.drawText(data.volunteerName, { x: MARGIN, y: yPos, size: 12, font });
  yPos -= 15;
  page.drawText(data.volunteerStreet, { x: MARGIN, y: yPos, size: 10, font });
  yPos -= 15;
  page.drawText(`${data.volunteerPlz} ${data.volunteerCity}`, {
    x: MARGIN,
    y: yPos,
    size: 10,
    font,
  });
  yPos -= 35;

  page.drawText("Verein:", { x: MARGIN, y: yPos, size: 10, font: boldFont });
  yPos -= 18;
  page.drawText(data.organizationName, { x: MARGIN, y: yPos, size: 12, font });
  yPos -= 15;
  if (data.organizationStreet) {
    page.drawText(data.organizationStreet, { x: MARGIN, y: yPos, size: 10, font });
    yPos -= 15;
  }
  if (data.organizationPlz || data.organizationCity) {
    page.drawText(`${data.organizationPlz || ""} ${data.organizationCity || ""}`.trim(), {
      x: MARGIN,
      y: yPos,
      size: 10,
      font,
    });
    yPos -= 15;
  }
  page.drawText(`Projekt: ${data.projectName}`, {
    x: MARGIN,
    y: yPos,
    size: 10,
    font,
  });
  yPos -= 35;

  page.drawText("Nebenberufliche Tätigkeit:", {
    x: MARGIN,
    y: yPos,
    size: 10,
    font: boldFont,
  });
  yPos -= 18;
  for (const line of splitText(data.activityDescription, 80)) {
    page.drawText(line, { x: MARGIN, y: yPos, size: 10, font });
    yPos -= 15;
  }
  yPos -= 10;

  page.drawText("Zeitraum:", { x: MARGIN, y: yPos, size: 10, font: boldFont });
  yPos -= 18;
  page.drawText(
    `${formatDate(data.startDate)} bis ${formatDate(data.endDate)}`,
    {
      x: MARGIN,
      y: yPos,
      size: 10,
      font,
    },
  );
  yPos -= 35;

  page.drawText("Betrag:", { x: MARGIN, y: yPos, size: 10, font: boldFont });
  yPos -= 18;
  page.drawText(`${data.amount.toFixed(2)} Euro`, {
    x: MARGIN,
    y: yPos,
    size: 14,
    font: boldFont,
  });
  yPos -= 35;

  page.drawText("Bankverbindung:", {
    x: MARGIN,
    y: yPos,
    size: 10,
    font: boldFont,
  });
  yPos -= 18;
  page.drawText(`Kontoinhaber: ${data.accountHolder}`, {
    x: MARGIN,
    y: yPos,
    size: 10,
    font,
  });
  yPos -= 15;
  page.drawText(`IBAN: ${data.iban}`, { x: MARGIN, y: yPos, size: 10, font });
  yPos -= 15;
  if (data.bic) {
    page.drawText(`BIC: ${data.bic}`, { x: MARGIN, y: yPos, size: 10, font });
  }
  yPos -= 35;

  page.drawText("Bestätigung gemäß § 3 Nr. 26a EStG:", {
    x: MARGIN,
    y: yPos,
    size: 10,
    font: boldFont,
  });
  yPos -= 18;
  const confirmationText =
    "Ich erkläre, dass die Steuerbefreiung nach § 3 Nr. 26a EStG für nebenberufliche " +
    `ehrenamtliche Tätigkeit in Höhe von ${data.amount.toFixed(2)} Euro in Anspruch genommen werden kann.`;
  for (const line of splitText(confirmationText, 85)) {
    page.drawText(line, { x: MARGIN, y: yPos, size: 9, font });
    yPos -= 13;
  }
  yPos -= 20;

  page.drawText("[X] Bestätigt", { x: MARGIN, y: yPos, size: 10, font });
  yPos -= 50;

  if (signatureUrl) {
    try {
      const response = await fetch(signatureUrl);
      const bytes = new Uint8Array(await response.arrayBuffer());
      const image = await pdfDoc.embedPng(bytes);
      const scale = Math.min(200 / image.width, 60 / image.height);
      page.drawImage(image, {
        x: MARGIN,
        y: yPos - image.height * scale,
        width: image.width * scale,
        height: image.height * scale,
      });
      yPos -= image.height * scale + 10;
    } catch (error) { console.error('Failed to embed signature:', error); }
  }

  page.drawLine({
    start: { x: MARGIN, y: yPos },
    end: { x: MARGIN + 200, y: yPos },
    thickness: 0.5,
  });
  yPos -= 15;
  page.drawText("Unterschrift Ehrenamtliche/r", {
    x: MARGIN,
    y: yPos,
    size: 9,
    font,
  });
  yPos -= 30;

  page.drawText(`Datum: ${new Date().toLocaleDateString("de-DE")}`, {
    x: MARGIN,
    y: yPos,
    size: 9,
    font,
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], {
    type: "application/pdf",
  });
}

function splitText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: Array<string> = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxChars) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("de-DE");
}
