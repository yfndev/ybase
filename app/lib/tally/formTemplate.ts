import type { TallyBlock } from "./types";

export const JOB_POSTING_HIDDEN_FIELD = "jobPostingId";

export function normalizeTemplateBlocks(blocks: TallyBlock[]): TallyBlock[] {
  return blocks.map((block) =>
    block.type === "IMAGE" ? { ...block, groupType: "IMAGE" } : block,
  );
}

export function resolveEmailFieldUuid(blocks: TallyBlock[]): string {
  const email = blocks.find((block) => block.type === "INPUT_EMAIL");
  if (!email) throw new Error("Die Vorlage enthält kein E-Mail-Feld");
  return email.uuid;
}

export function withRequiredPhoneField(blocks: TallyBlock[]): TallyBlock[] {
  let hasPhoneField = false;
  const requiredBlocks = blocks.map((block) => {
    if (!block.type.toUpperCase().includes("PHONE")) return block;
    hasPhoneField = true;
    return {
      ...block,
      payload: {
        ...block.payload,
        isRequired: true,
      },
    };
  });
  if (!hasPhoneField) {
    throw new Error("Die Tally-Vorlage enthält kein Telefonnummer-Feld");
  }
  return requiredBlocks;
}

export function withHiddenField(
  blocks: TallyBlock[],
  name: string,
): TallyBlock[] {
  const alreadyExists = blocks.some((block) => {
    if (block.type !== "HIDDEN_FIELDS") return false;
    const hiddenFields = block.payload?.hiddenFields;
    return (
      Array.isArray(hiddenFields) &&
      hiddenFields.some(
        (field) =>
          typeof field === "object" &&
          field !== null &&
          "name" in field &&
          field.name === name,
      )
    );
  });
  if (alreadyExists) return blocks;

  const hiddenBlock: TallyBlock = {
    uuid: crypto.randomUUID(),
    type: "HIDDEN_FIELDS",
    groupUuid: crypto.randomUUID(),
    groupType: "HIDDEN_FIELDS",
    payload: { hiddenFields: [{ uuid: crypto.randomUUID(), name }] },
  };
  const breakIndex = blocks.findIndex((block) => block.type === "PAGE_BREAK");
  const at = breakIndex === -1 ? blocks.length : breakIndex;
  return [...blocks.slice(0, at), hiddenBlock, ...blocks.slice(at)];
}
