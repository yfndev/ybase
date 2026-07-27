import type { ApplicationStatus } from "../db/types";

export type ApplicationDecision = Extract<
  ApplicationStatus,
  "accepted" | "rejected"
>;

export function applicationDecisionEmailDefaults(input: {
  decision: ApplicationDecision;
  applicantName?: string;
  jobTitle: string;
}): { subject: string; message: string } {
  const greeting = input.applicantName?.trim()
    ? `Hey ${input.applicantName.trim()},`
    : "Hey,";

  if (input.decision === "accepted") {
    return {
      subject: `Zusage für deine Bewerbung als ${input.jobTitle}`,
      message: `${greeting}\n\nvielen Dank für deine Bewerbung. Wir freuen uns, dir für die Position ${input.jobTitle} eine Zusage zu geben.\n\nDein YFN-Konto wird mit der Zusage eingerichtet. Die Zugangsdaten und den Link zu YBase findest du in dieser E-Mail.`,
    };
  }

  return {
    subject: `Rückmeldung zu deiner Bewerbung als ${input.jobTitle}`,
    message: `${greeting}\n\nvielen Dank für deine Bewerbung und dein Interesse an der Position ${input.jobTitle}. Leider können wir dir dieses Mal keine Zusage geben.\n\nWir wünschen dir für deinen weiteren Weg alles Gute.`,
  };
}

export function appendWorkspaceAccessDetails(input: {
  message: string;
  primaryEmail: string;
  temporaryPassword: string;
  loginUrl: string;
}): string {
  return `${input.message.trim()}\n\nDein YFN-Zugang\nE-Mail: ${input.primaryEmail}\nTemporäres Passwort: ${input.temporaryPassword}\n\nBitte ändere das Passwort bei deiner ersten Anmeldung. Anschließend kannst du dich direkt über Google in YBase anmelden:\n${input.loginUrl}`;
}
