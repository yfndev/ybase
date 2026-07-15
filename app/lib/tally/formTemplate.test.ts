import { expect, test } from "vitest";
import {
  JOB_POSTING_HIDDEN_FIELD,
  normalizeTemplateBlocks,
  resolveEmailFieldUuid,
  withHiddenField,
} from "./formTemplate";
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
