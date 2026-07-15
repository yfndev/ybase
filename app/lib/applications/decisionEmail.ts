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
      message: `${greeting}\n\nvielen Dank für deine Bewerbung. Wir freuen uns, dir eine Zusage für die Position ${input.jobTitle} geben zu können.\n\nWir melden uns zeitnah mit den nächsten Schritten bei dir.`,
    };
  }

  return {
    subject: `Rückmeldung zu deiner Bewerbung als ${input.jobTitle}`,
    message: `${greeting}\n\nvielen Dank für deine Bewerbung und dein Interesse an der Position ${input.jobTitle}. Leider können wir dir dieses Mal keine Zusage geben.\n\nWir wünschen dir für deinen weiteren Weg alles Gute.`,
  };
}
