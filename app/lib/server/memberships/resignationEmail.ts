import type { Membership } from "../../db/types";
import { sendMail } from "../../email/brevo";
import { appUrl } from "../../email/urls";
import { YFN_ORGANIZATION } from "../../organization";
import { RESIGNATION_DECLARATION_TEXT } from "./resignationDeclaration";

const EMAIL_SENDER = {
  name: "YBase",
  email: "no-reply@youngfounders.network",
};
const PEOPLE_TEAM = { email: "people@youngfounders.network" };
const DATE_FORMAT = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

type MemberMailData = Pick<
  Membership,
  "firstName" | "lastName" | "privateEmail"
>;

export async function sendGuardianResignationRequest(input: {
  member: MemberMailData;
  guardianName: string;
  guardianEmail: string;
  token: string;
  expectedEndAt: number;
  expiresAt: number;
}): Promise<boolean> {
  const memberName = `${input.member.firstName} ${input.member.lastName}`;
  return deliver({
    to: [{ email: input.guardianEmail, name: input.guardianName }],
    subject: `Austritt von ${memberName} bestätigen`,
    textContent: [
      `Hallo ${input.guardianName},`,
      "",
      `${memberName} möchte die Mitgliedschaft im ${YFN_ORGANIZATION.name} beenden.`,
      `Das voraussichtliche Mitgliedschaftsende ist der ${formatEndDate(input.expectedEndAt)}.`,
      "",
      "Bitte bestätige den Austritt über diesen persönlichen Link:",
      appUrl(`/membership/resignation/${input.token}`),
      "",
      `Der Link ist bis zum ${DATE_FORMAT.format(input.expiresAt)} gültig.`,
    ].join("\n"),
    tags: ["ybase", "membership", "resignation-guardian-request"],
  });
}

export async function sendResignationConfirmation(input: {
  member: MemberMailData;
  receivedAt: number;
  scheduledEndAt: number;
  guardian?: { name: string; email: string };
}): Promise<boolean> {
  const memberName = `${input.member.firstName} ${input.member.lastName}`;
  const to = [
    { email: input.member.privateEmail, name: memberName },
    ...(input.guardian
      ? [{ email: input.guardian.email, name: input.guardian.name }]
      : []),
  ];
  return deliver({
    to,
    subject: "Bestätigung deiner Austrittserklärung",
    textContent: [
      `Hallo ${input.member.firstName},`,
      "",
      `wir bestätigen den Eingang deiner Austrittserklärung beim ${YFN_ORGANIZATION.name}.`,
      "",
      RESIGNATION_DECLARATION_TEXT,
      "",
      `Eingegangen am: ${DATE_FORMAT.format(input.receivedAt)}`,
      `Mitgliedschaftsende: ${formatEndDate(input.scheduledEndAt)}`,
      "",
      "Bis zu diesem Datum bleiben deine Mitgliedschaft und deine Zugänge bestehen.",
      "Diese E-Mail dient dir als dauerhafte Bestätigung der Erklärung.",
    ].join("\n"),
    tags: ["ybase", "membership", "resignation-confirmed"],
    ccPeople: true,
  });
}

async function deliver(input: {
  to: { email: string; name?: string }[];
  subject: string;
  textContent: string;
  tags: string[];
  ccPeople?: boolean;
}): Promise<boolean> {
  try {
    const { ccPeople, ...message } = input;
    const delivery = await sendMail({
      ...message,
      sender: EMAIL_SENDER,
      replyTo: PEOPLE_TEAM,
      ...(ccPeople ? { cc: [PEOPLE_TEAM] } : {}),
    });
    return delivery.status === "sent";
  } catch (error) {
    console.error("Could not send membership resignation email", error);
    return false;
  }
}

function formatEndDate(scheduledEndAt: number): string {
  return DATE_FORMAT.format(scheduledEndAt - 1);
}
