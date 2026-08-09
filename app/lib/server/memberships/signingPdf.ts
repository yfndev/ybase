import type { DocumentBlockStyle } from "./documentText";
import { htmlToDocumentBlocks } from "./documentText";
import type { WriteOptions } from "./pdfLayout";
import {
  createPdfWriter,
  drawSignatureImage,
  writeGap,
  writeText,
} from "./pdfLayout";

const BLOCK_OPTIONS = {
  heading: { size: 13, bold: true, gap: 6 },
  subheading: { size: 11, bold: true, gap: 4 },
  body: { size: 10, gap: 7 },
  listitem: { size: 10, indent: 16, gap: 4 },
} as const satisfies Record<DocumentBlockStyle, WriteOptions>;

export function decodeSignatureDataUrl(dataUrl: string): Uint8Array {
  const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Error("Die Unterschrift muss als PNG vorliegen.");
  return validateSignaturePng(Buffer.from(match[1], "base64"));
}

export function validateSignaturePng(bytes: Uint8Array): Uint8Array {
  if (bytes.byteLength < 100 || bytes.byteLength > 500_000) {
    throw new Error("Die Unterschrift ist leer oder zu groß.");
  }
  const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!pngSignature.every((byte, index) => bytes[index] === byte)) {
    throw new Error("Die Unterschrift muss als PNG vorliegen.");
  }
  return bytes;
}

export async function createExecutionPdf(input: {
  contentHtml: string;
  signaturePng?: Uint8Array;
  title: string;
  versionLabel: string;
  documentHash: string;
  membershipId?: string;
  userId: string;
  completedAt: number;
  consentGranted?: boolean;
}): Promise<Uint8Array> {
  const writer = await createPdfWriter();
  writeText(writer, input.title, { size: 18, bold: true, gap: 4 });
  writeText(writer, `Version ${input.versionLabel}`, { size: 9, gap: 18 });
  for (const block of htmlToDocumentBlocks(input.contentHtml)) {
    writeText(writer, block.text, BLOCK_OPTIONS[block.style]);
  }

  writeGap(writer, 26);
  writeText(writer, "Nachweis der Ausführung", {
    size: 13,
    bold: true,
    gap: 8,
  });
  for (const line of evidenceLines(input)) {
    writeText(writer, line, { size: 9, gap: 3 });
  }
  if (input.signaturePng) {
    writeGap(writer, 14);
    writeText(writer, "Unterschrift", { size: 10, bold: true, gap: 8 });
    await drawSignatureImage(writer, input.signaturePng);
  } else {
    writeGap(writer, 10);
    writeText(writer, "Elektronisch zur Kenntnis genommen.", { size: 10 });
  }
  return writer.document.save();
}

function evidenceLines(input: {
  versionLabel: string;
  documentHash: string;
  membershipId?: string;
  userId: string;
  completedAt: number;
  consentGranted?: boolean;
}): string[] {
  return [
    `Version: ${input.versionLabel}`,
    `SHA-256 des Dokumententexts: ${input.documentHash}`,
    ...(input.membershipId ? [`Membership-ID: ${input.membershipId}`] : []),
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
}
