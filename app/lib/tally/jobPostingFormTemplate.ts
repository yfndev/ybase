import { DEFAULT_APPLICATION_QUESTIONS } from "../jobPostings/applicationQuestions";
import type { JobPosting } from "../db/types";
import type { TallyBlock } from "./types";

type JobPostingTallyContent = Pick<
  JobPosting,
  "title" | "applicationQuestions"
>;

export function jobPostingFormTitle(jobTitle: string): string {
  return `Baue das Young Founders Network mit auf: Bewerbung als ${jobTitle.trim()}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function withFormTitle(
  blocks: TallyBlock[],
  title: string,
): TallyBlock[] {
  return blocks.map((block) =>
    block.type === "FORM_TITLE"
      ? {
          ...block,
          payload: {
            ...block.payload,
            title,
            html: escapeHtml(title),
            safeHTMLSchema: [[title]],
          },
        }
      : block,
  );
}

function containsText(value: unknown, text: string): boolean {
  if (typeof value === "string") return value.includes(text);
  return Array.isArray(value) && value.some((item) => containsText(item, text));
}

function reusableBlockPool(blocks: TallyBlock[]): Map<string, TallyBlock[]> {
  const pool = new Map<string, TallyBlock[]>();
  for (const block of blocks) {
    const matches = pool.get(block.type) ?? [];
    matches.push(block);
    pool.set(block.type, matches);
  }
  return pool;
}

function contentBlock(
  pool: Map<string, TallyBlock[]>,
  type: "HEADING_3" | "LABEL",
  text: string,
): TallyBlock {
  const existing = pool.get(type)?.shift();
  return {
    uuid: existing?.uuid ?? crypto.randomUUID(),
    type,
    groupUuid: existing?.groupUuid ?? crypto.randomUUID(),
    groupType: type,
    payload: {
      ...existing?.payload,
      safeHTMLSchema: [[text]],
    },
  };
}

function questionInput(pool: Map<string, TallyBlock[]>): TallyBlock {
  const existing = pool.get("TEXTAREA")?.shift();
  return {
    uuid: existing?.uuid ?? crypto.randomUUID(),
    type: "TEXTAREA",
    groupUuid: existing?.groupUuid ?? crypto.randomUUID(),
    groupType: "TEXTAREA",
    payload: {
      ...existing?.payload,
      isRequired: true,
      placeholder: existing?.payload?.placeholder ?? "3 - 5 Zeilen",
    },
  };
}

export function withJobPostingContent(
  blocks: TallyBlock[],
  posting: JobPostingTallyContent,
): TallyBlock[] {
  const titled = withFormTitle(blocks, jobPostingFormTitle(posting.title));
  const roleHeadingIndex = titled.findIndex(
    (block) =>
      block.type === "HEADING_2" &&
      containsText(block.payload?.safeHTMLSchema, "Deine Stelle:"),
  );
  if (roleHeadingIndex === -1) return titled;

  const nextSectionOffset = titled
    .slice(roleHeadingIndex + 1)
    .findIndex(
      (block) => block.type === "HEADING_2" || block.type === "PAGE_BREAK",
    );
  const roleSectionEnd =
    nextSectionOffset === -1
      ? titled.length
      : roleHeadingIndex + 1 + nextSectionOffset;
  const pool = reusableBlockPool(
    titled.slice(roleHeadingIndex + 1, roleSectionEnd),
  );
  const generated: TallyBlock[] = [];

  const questions = (
    posting.applicationQuestions ?? [...DEFAULT_APPLICATION_QUESTIONS]
  )
    .map((question) => question.trim())
    .filter(Boolean);
  if (questions.length > 0) {
    generated.push(contentBlock(pool, "HEADING_3", "Fragen zur Rolle"));
    for (const question of questions) {
      generated.push(
        contentBlock(pool, "LABEL", question),
        questionInput(pool),
      );
    }
  }

  return [
    ...titled.slice(0, roleHeadingIndex),
    ...generated,
    ...titled.slice(roleSectionEnd),
  ];
}
