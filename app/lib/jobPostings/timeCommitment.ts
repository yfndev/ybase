export const JOB_POSTING_TIME_COMMITMENTS = [
  "Unter 4 Stunden",
  "Zwischen 4 und 8 Stunden",
  "Über 8 Stunden",
] as const;

export type JobPostingTimeCommitment =
  (typeof JOB_POSTING_TIME_COMMITMENTS)[number];

export function isJobPostingTimeCommitment(
  value: string,
): value is JobPostingTimeCommitment {
  return JOB_POSTING_TIME_COMMITMENTS.some((option) => option === value);
}
