import { expect, test } from "vitest";
import {
  JOB_POSTING_HIDDEN_FIELD,
  normalizeTemplateBlocks,
  resolveEmailFieldUuid,
  withHiddenField,
  withRequiredPhoneField,
} from "./formTemplate";
import {
  jobPostingFormTitle,
  withFormTitle,
  withJobPostingContent,
} from "./jobPostingFormTemplate";
import type { TallyBlock } from "./types";

function block(type: string, groupType = type, uuid = type): TallyBlock {
  return { uuid, type, groupUuid: `${uuid}-group`, groupType };
}

test("normalizeTemplateBlocks fixes only IMAGE group types", () => {
  const blocks = [
    block("IMAGE", "TEXT"),
    block("CHECKBOX", "CHECKBOXES"),
    block("INPUT_EMAIL"),
  ];
  const result = normalizeTemplateBlocks(blocks);
  expect(result[0].groupType).toBe("IMAGE");
  expect(result[1].groupType).toBe("CHECKBOXES");
  expect(result[2].groupType).toBe("INPUT_EMAIL");
});

test("resolveEmailFieldUuid returns the email block uuid", () => {
  const blocks = [
    block("INPUT_TEXT"),
    block("INPUT_EMAIL", "INPUT_EMAIL", "email-1"),
  ];
  expect(resolveEmailFieldUuid(blocks)).toBe("email-1");
});

test("resolveEmailFieldUuid throws when the template has no email field", () => {
  expect(() => resolveEmailFieldUuid([block("INPUT_TEXT")])).toThrow(
    "E-Mail-Feld",
  );
});

test("makes the existing phone field required", () => {
  const blocks = [
    block("INPUT_EMAIL"),
    {
      ...block("INPUT_PHONE_NUMBER", "INPUT_PHONE_NUMBER", "phone-1"),
      payload: { isRequired: false, defaultCountryCode: "DE" },
    },
  ];

  expect(withRequiredPhoneField(blocks)[1]).toEqual({
    ...blocks[1],
    payload: { isRequired: true, defaultCountryCode: "DE" },
  });
});

test("rejects a template without a phone field", () => {
  expect(() => withRequiredPhoneField([block("INPUT_EMAIL")])).toThrow(
    "Telefonnummer-Feld",
  );
});

test("builds and applies the dynamic job posting title", () => {
  const title = jobPostingFormTitle("  Vorstand & Strategie  ");
  const result = withFormTitle(
    [
      {
        ...block("FORM_TITLE"),
        payload: { title: "VORLAGE", html: "VORLAGE", alignment: "left" },
      },
      block("INPUT_EMAIL"),
    ],
    title,
  );

  expect(title).toBe(
    "Baue das Young Founders Network mit auf: Bewerbung als Vorstand & Strategie",
  );
  expect(result[0].payload).toEqual({
    title,
    html: "Baue das Young Founders Network mit auf: Bewerbung als Vorstand &amp; Strategie",
    alignment: "left",
    safeHTMLSchema: [[title]],
  });
  expect(result[1]).toEqual(block("INPUT_EMAIL"));
});

test("withHiddenField inserts the hidden block before the first page break", () => {
  const blocks = [block("INPUT_EMAIL"), block("PAGE_BREAK"), block("TEXT")];
  const result = withHiddenField(blocks, JOB_POSTING_HIDDEN_FIELD);
  expect(result).toHaveLength(4);
  expect(result[1].type).toBe("HIDDEN_FIELDS");
  expect(result[2].type).toBe("PAGE_BREAK");
  const payload = result[1].payload as { hiddenFields: { name: string }[] };
  expect(payload.hiddenFields[0].name).toBe("jobPostingId");
});

test("withHiddenField appends when there is no page break", () => {
  const result = withHiddenField(
    [block("INPUT_EMAIL")],
    JOB_POSTING_HIDDEN_FIELD,
  );
  expect(result[result.length - 1].type).toBe("HIDDEN_FIELDS");
});

test("withHiddenField leaves an existing job posting field unchanged", () => {
  const blocks = [
    block("INPUT_EMAIL"),
    {
      ...block("HIDDEN_FIELDS"),
      payload: {
        hiddenFields: [{ uuid: "hidden-1", name: JOB_POSTING_HIDDEN_FIELD }],
      },
    },
  ];

  expect(withHiddenField(blocks, JOB_POSTING_HIDDEN_FIELD)).toBe(blocks);
});

test("applies the title and replaces the role section with application questions", () => {
  const roleHeading = {
    ...block("HEADING_2"),
    payload: { safeHTMLSchema: [["Deine Stelle: XXX"]] },
  };
  const otherHeading = {
    ...block("HEADING_2", "HEADING_2", "other-heading"),
    payload: { safeHTMLSchema: [["Wieso YFN?"]] },
  };

  const result = withJobPostingContent(
    [block("FORM_TITLE"), roleHeading, otherHeading],
    { title: "  Tech Lead  " },
  );

  expect(result[0].payload?.safeHTMLSchema).toEqual([
    ["Baue das Young Founders Network mit auf: Bewerbung als Tech Lead"],
  ]);
  expect(result[1].payload?.safeHTMLSchema).toEqual([["Fragen zur Rolle"]]);
  expect(result.at(-1)).toEqual(otherHeading);
  expect(JSON.stringify(result)).not.toContain("Deine Stelle:");
  expect(JSON.stringify(result)).not.toContain("Spezifische Frage");
  expect(JSON.stringify(result)).toContain(
    "Was reizt dich besonders an dieser Rolle?",
  );
});

test("removes posting details and syncs exact application questions", () => {
  const roleHeading = {
    ...block("HEADING_2", "HEADING_2", "role-heading"),
    payload: { safeHTMLSchema: [["Deine Stelle: XXX"]] },
  };
  const nextHeading = {
    ...block("HEADING_2", "HEADING_2", "next-heading"),
    payload: { safeHTMLSchema: [["Entrepreneurial Mindset"]] },
  };
  const result = withJobPostingContent(
    [
      block("FORM_TITLE"),
      roleHeading,
      {
        ...block("HEADING_3", "HEADING_3", "old-benefits-heading"),
        payload: { safeHTMLSchema: [["Benefits"]] },
      },
      {
        ...block("TEXT", "TEXT", "old-benefits-text"),
        payload: { safeHTMLSchema: [["Alte Benefits"]] },
      },
      {
        ...block("LABEL", "LABEL", "question-label"),
        payload: { safeHTMLSchema: [["Spezifische Frage 1"]] },
      },
      {
        ...block("TEXTAREA", "TEXTAREA", "question-input"),
        payload: { isRequired: true, placeholder: "5 - 8 Zeilen" },
      },
      nextHeading,
    ],
    {
      title: "Tech Lead",
      applicationQuestions: ["Welche Systeme hast du bereits verantwortet?"],
    },
  );
  const serialized = JSON.stringify(result);

  expect(serialized).not.toContain("Deine Stelle:");
  expect(serialized).not.toContain("Benefits");
  expect(serialized).not.toContain("Alte Benefits");
  expect(serialized).toContain("Fragen zur Rolle");
  expect(serialized).toContain("Welche Systeme hast du bereits verantwortet?");
  expect(serialized).not.toContain("Spezifische Frage");
  expect(result.at(-1)).toEqual(nextHeading);
  expect(result.find((item) => item.type === "TEXTAREA")?.uuid).toBe(
    "question-input",
  );
});
