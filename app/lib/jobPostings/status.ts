import type { JobPostingStatus } from "@/lib/db/types";

export const JOB_POSTING_STATUS_LABELS: Record<JobPostingStatus, string> = {
  draft: "Entwurf",
  published: "Veröffentlicht",
  closed: "Geschlossen",
  archived: "Archiviert",
};

export function statusMeansClosed(status: JobPostingStatus): boolean {
  return status === "closed" || status === "archived";
}
