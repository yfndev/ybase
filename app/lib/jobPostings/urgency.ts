import type { JobPostingUrgency } from "@/lib/db/types";

export const JOB_POSTING_URGENCY_LABELS: Record<JobPostingUrgency, string> = {
  normal: "Normal",
  urgent: "Dringend",
};

export function jobPostingUrgency(
  urgency?: JobPostingUrgency,
): JobPostingUrgency {
  return urgency ?? "normal";
}
