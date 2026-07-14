import type { ApplicationStatus } from "@/lib/db/types";

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  received: "Eingegangen",
  review: "In Prüfung",
  interview: "Interview",
  accepted: "Angenommen",
  rejected: "Abgelehnt",
  withdrawn: "Zurückgezogen",
};
