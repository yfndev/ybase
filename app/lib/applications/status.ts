import type { ApplicationStatus, ApplicationWithFiles } from "@/lib/db/types";

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  received: "Eingegangen",
  review: "In Prüfung",
  interview: "Interview",
  accepted: "Angenommen",
  rejected: "Abgelehnt",
  withdrawn: "Zurückgezogen",
};

export type ApplicationDisplayStatus =
  | ApplicationStatus
  | "ybase_registered"
  | "onboarding_active"
  | "onboarding_completed";

export const APPLICATION_DISPLAY_STATUS_LABELS: Record<
  ApplicationDisplayStatus,
  string
> = {
  ...APPLICATION_STATUS_LABELS,
  ybase_registered: "Bei YBase registriert",
  onboarding_active: "Im Onboarding",
  onboarding_completed: "Onboarding abgeschlossen",
};

export function getApplicationDisplayStatus(
  application: Pick<
    ApplicationWithFiles,
    | "status"
    | "onboardingUserId"
    | "onboardingStartedAt"
    | "onboardingCompletedAt"
  >,
): ApplicationDisplayStatus {
  if (application.status !== "accepted") return application.status;
  if (application.onboardingCompletedAt) return "onboarding_completed";
  if (application.onboardingStartedAt) return "onboarding_active";
  if (application.onboardingUserId) return "ybase_registered";
  return "accepted";
}
