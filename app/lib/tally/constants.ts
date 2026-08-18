export const TALLY_API_VERSION = "2026-06-23";
export const TALLY_RECRUITING_WORKSPACE_ID = "w8G50z";
export const TALLY_RECRUITING_TEMPLATE_WORKSPACE_ID = "3X25Oz";
export const TALLY_RECRUITING_TEMPLATE_FOLDER_NAME = "Vorlagen";
export const TALLY_RECRUITING_FALLBACK_TEMPLATE_FORM_ID = "LZVp7l";

export function tallyFormEditorUrl(formId: string): string {
  return `https://tally.so/forms/${encodeURIComponent(formId)}/edit`;
}
