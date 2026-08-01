import sanitizeHtml from "sanitize-html";
import type { JobPosting } from "../db/types";

export type JobPostingTallyContent = Pick<
  JobPosting,
  | "title"
  | "shortText"
  | "description"
  | "tasks"
  | "requirements"
  | "timeCommitment"
  | "location"
  | "isRemote"
  | "deadline"
  | "applicationQuestions"
>;

function richTextToPlainText(value: string | undefined): string {
  if (!value) return "";
  const withLineBreaks = value
    .replace(/<li\b[^>]*>/gi, "• ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|h[1-6]|li|blockquote|ul|ol)>/gi, "\n");
  return sanitizeHtml(withLineBreaks, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replaceAll("\u00a0", " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatDeadline(value: string | undefined): string {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : (value?.trim() ?? "");
}

export function jobPostingSections(
  posting: JobPostingTallyContent,
): Array<{ heading: string; text: string }> {
  const overview = [
    posting.shortText?.trim(),
    richTextToPlainText(posting.description),
  ]
    .filter(Boolean)
    .join("\n\n");
  const location = posting.isRemote
    ? posting.location?.trim()
      ? `${posting.location.trim()} · Remote möglich`
      : "Remote"
    : posting.location?.trim();
  const framework = [
    posting.timeCommitment?.trim()
      ? `Zeitaufwand: ${posting.timeCommitment.trim()}`
      : "",
    location ? `Arbeitsort: ${location}` : "",
    posting.deadline?.trim()
      ? `Bewerbungsfrist: ${formatDeadline(posting.deadline)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return [
    { heading: "Über die Rolle", text: overview },
    { heading: "Aufgaben", text: richTextToPlainText(posting.tasks) },
    {
      heading: "Anforderungen",
      text: richTextToPlainText(posting.requirements),
    },
    { heading: "Rahmenbedingungen", text: framework },
  ].filter((section) => section.text);
}
