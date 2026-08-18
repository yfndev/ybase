import type {
  MembershipGender,
  Organization,
  PostalAddress,
} from "../../db/types";
import { MEMBERSHIP_GENDER_LABELS } from "../../members/gender";
import { GUARDIAN_CONSENT_TEXT } from "../../members/guardianConsent";
import {
  createPdfWriter,
  drawSignatureImage,
  writeGap,
  writeText,
} from "./pdfLayout";

export interface MembershipApplicationPdfInput {
  organization: Organization;
  membershipNumber: string;
  membershipId: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: MembershipGender;
  phone: string;
  privateEmail: string;
  address: PostalAddress;
  signedAt: number;
  signaturePng: Uint8Array;
  guardian?: {
    representativeName: string;
    representativeEmail: string;
    signaturePng: Uint8Array;
  };
}

export async function createMembershipApplicationPdf(
  input: MembershipApplicationPdfInput,
): Promise<Uint8Array> {
  const writer = await createPdfWriter();
  writeText(writer, `Mitgliedsantrag ${input.organization.name}`, {
    size: 18,
    bold: true,
    gap: 14,
  });
  for (const line of associationLines(input.organization)) {
    writeText(writer, line, { size: 10, gap: 2 });
  }

  writeGap(writer, 20);
  for (const [label, value] of applicantFields(input)) {
    writeText(writer, `${label}: ${value}`, { size: 10, gap: 4 });
  }

  writeGap(writer, 20);
  writeText(writer, "Unterschrift Mitglied", { size: 10, bold: true, gap: 8 });
  await drawSignatureImage(writer, input.signaturePng);

  if (input.guardian) {
    writeGap(writer, 16);
    writeText(writer, "Zustimmung der gesetzlichen Vertretung", {
      size: 10,
      bold: true,
      gap: 6,
    });
    writeText(writer, GUARDIAN_CONSENT_TEXT, { size: 9, gap: 6 });
    writeText(writer, `Name: ${input.guardian.representativeName}`, {
      size: 9,
      gap: 3,
    });
    writeText(writer, `E-Mail: ${input.guardian.representativeEmail}`, {
      size: 9,
      gap: 8,
    });
    await drawSignatureImage(writer, input.guardian.signaturePng);
  }

  writeGap(writer, 18);
  for (const line of evidenceLines(input)) {
    writeText(writer, line, { size: 9, gap: 3 });
  }
  return writer.document.save();
}

function associationLines(organization: Organization): string[] {
  return [
    organization.name,
    ...(organization.careOf ? [`c/o ${organization.careOf}`] : []),
    ...(organization.street ? [organization.street] : []),
    ...(organization.plz || organization.city
      ? [[organization.plz, organization.city].filter(Boolean).join(" ")]
      : []),
  ];
}

function applicantFields(
  input: MembershipApplicationPdfInput,
): [string, string][] {
  return [
    ["Nachname", input.lastName],
    ["Vorname", input.firstName],
    ["Straße und Hausnummer", input.address.street],
    ["Postleitzahl", input.address.postalCode],
    ["Ort", input.address.city],
    ["Land", input.address.country],
    ["Geburtsdatum", input.dateOfBirth],
    ["Geschlecht", MEMBERSHIP_GENDER_LABELS[input.gender]],
    ["Telefonnummer", input.phone],
    ["Private E-Mailadresse", input.privateEmail],
  ];
}

function evidenceLines(input: MembershipApplicationPdfInput): string[] {
  return [
    `Mitgliedsnummer: ${input.membershipNumber}`,
    `Membership-ID: ${input.membershipId}`,
    `User-ID: ${input.userId}`,
    `Zeitpunkt: ${new Date(input.signedAt).toISOString()}`,
  ];
}
