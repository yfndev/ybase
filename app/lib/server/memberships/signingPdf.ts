import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export function decodeSignatureDataUrl(dataUrl: string): Uint8Array {
  const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Error("Die Unterschrift muss als PNG vorliegen.");
  const bytes = Buffer.from(match[1], "base64");
  if (bytes.byteLength < 100 || bytes.byteLength > 500_000) {
    throw new Error("Die Unterschrift ist leer oder zu groß.");
  }
  return bytes;
}

export async function createExecutionPdf(input: {
  snapshotPdf: Uint8Array;
  signaturePng?: Uint8Array;
  title: string;
  versionLabel: string;
  documentHash: string;
  membershipId: string;
  userId: string;
  completedAt: number;
  consentGranted?: boolean;
}): Promise<Uint8Array> {
  const source = await PDFDocument.load(input.snapshotPdf);
  const output = await PDFDocument.create();
  const pages = await output.copyPages(source, source.getPageIndices());
  for (const page of pages) output.addPage(page);

  const page = output.addPage([595, 842]);
  const font = await output.embedFont(StandardFonts.Helvetica);
  const bold = await output.embedFont(StandardFonts.HelveticaBold);
  page.drawText("Nachweis der Ausführung", {
    x: 52,
    y: 780,
    size: 18,
    font: bold,
    color: rgb(0.08, 0.1, 0.14),
  });
  const lines = [
    `Dokument: ${input.title}`,
    `Version: ${input.versionLabel}`,
    `SHA-256: ${input.documentHash}`,
    `Membership-ID: ${input.membershipId}`,
    `User-ID: ${input.userId}`,
    `Zeitpunkt: ${new Date(input.completedAt).toISOString()}`,
    ...(input.consentGranted === undefined
      ? []
      : [
          `Freiwillige Einwilligung: ${
            input.consentGranted ? "erteilt" : "nicht erteilt"
          }`,
        ]),
  ];
  lines.forEach((line, index) => {
    page.drawText(line, { x: 52, y: 730 - index * 24, size: 10, font });
  });
  if (input.signaturePng) {
    const signature = await output.embedPng(input.signaturePng);
    const scale = Math.min(260 / signature.width, 110 / signature.height, 1);
    page.drawText("Unterschrift", { x: 52, y: 570, size: 10, font: bold });
    page.drawImage(signature, {
      x: 52,
      y: 440,
      width: signature.width * scale,
      height: signature.height * scale,
    });
  } else {
    page.drawText("Elektronisch zur Kenntnis genommen.", {
      x: 52,
      y: 550,
      size: 11,
      font,
    });
  }
  return output.save();
}
