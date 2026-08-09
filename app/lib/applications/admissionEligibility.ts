import { ageOnDate } from "../members/legalDates";

export const APPLICATION_ADMISSION_ERRORS = {
  PROFILE_REQUIRED:
    "Vor der Aufnahme muss ein eindeutiges Member-Plattform-Profil mit gültigem Geburtsdatum verknüpft sein.",
  AGE_REQUIRED:
    "Bei der Aufnahmeentscheidung muss die Person mindestens 16 und noch nicht 25 Jahre alt sein.",
} as const;

interface AdmissionRequirements {
  dateOfBirth?: string;
  memberPlatformUserId?: string;
}

export function getApplicationAdmissionIssue(
  application: AdmissionRequirements,
  decidedAt: number,
): string | undefined {
  if (!application.memberPlatformUserId || !application.dateOfBirth) {
    return APPLICATION_ADMISSION_ERRORS.PROFILE_REQUIRED;
  }

  let age: number;
  try {
    age = ageOnDate(application.dateOfBirth, decidedAt);
  } catch {
    return APPLICATION_ADMISSION_ERRORS.PROFILE_REQUIRED;
  }
  if (age < 16 || age >= 25) {
    return APPLICATION_ADMISSION_ERRORS.AGE_REQUIRED;
  }
  return undefined;
}

export function assertApplicationAdmissionReady(
  application: AdmissionRequirements,
  decidedAt: number,
): void {
  const issue = getApplicationAdmissionIssue(application, decidedAt);
  if (issue) throw new Error(issue);
}
