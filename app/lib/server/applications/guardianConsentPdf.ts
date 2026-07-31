import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { GUARDIAN_CONSENT_TEXT } from "../../applications/guardianConsent";

export async function createGuardianConsentPdf(input: {
  applicantName: string;
  applicationId: string;
  dateOfBirth: string;
  representativeName: string;
  signedAt: number;
  signaturePng: Uint8Array;
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  page.drawText("Zustimmung der gesetzlichen Vertretung", {
    x: 52,
    y: 780,
    size: 18,
    font: bold,
    color: rgb(0.08, 0.1, 0.14),
  });
  const lines = [
    `Bewerber:in: ${input.applicantName}`,
    `Geburtsdatum: ${input.dateOfBirth}`,
    `Vertretung: ${input.representativeName}`,
    `Bewerbungs-ID: ${input.applicationId}`,
    `Zeitpunkt: ${new Date(input.signedAt).toISOString()}`,
  ];
  lines.forEach((line, index) => {
    page.drawText(line, { x: 52, y: 730 - index * 24, size: 11, font });
  });
  page.drawText(GUARDIAN_CONSENT_TEXT, {
    x: 52,
    y: 570,
    size: 11,
    font,
    maxWidth: 490,
    lineHeight: 16,
  });
  const signature = await pdf.embedPng(input.signaturePng);
  const scale = Math.min(260 / signature.width, 110 / signature.height, 1);
  page.drawText("Unterschrift", { x: 52, y: 510, size: 10, font: bold });
  page.drawImage(signature, {
    x: 52,
    y: 370,
    width: signature.width * scale,
    height: signature.height * scale,
  });
  return pdf.save();
}
