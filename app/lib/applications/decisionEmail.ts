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
      message: `${greeting}\n\nvielen Dank für deine Bewerbung. Wir freuen uns, dir für die Position ${input.jobTitle} eine Zusage zu geben.\n\nDein YFN-Konto wird mit der Zusage eingerichtet. Deine Google-Workspace-Zugangsdaten erhältst du in einer separaten E-Mail.`,
    };
  }

  return {
    subject: `Rückmeldung zu deiner Bewerbung als ${input.jobTitle}`,
    message: `${greeting}\n\nvielen Dank für deine Bewerbung und dein Interesse an der Position ${input.jobTitle}. Leider können wir dir dieses Mal keine Zusage geben.\n\nWir wünschen dir für deinen weiteren Weg alles Gute.`,
  };
}
