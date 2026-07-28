import type { ApplicationStatus } from "../db/types";

export type ApplicationMainStatus =
  | "application"
  | "interview"
  | "accepted"
  | "rejected"
  | "withdrawn";

export function getApplicationMainStatus(
  status: ApplicationStatus,
): ApplicationMainStatus {
  if (status === "received" || status === "review") return "application";
  return status;
}
