export const TALLY_API_VERSION = "2026-06-23";
export const TALLY_RECRUITING_WORKSPACE_ID = "w8G50z";
export const TALLY_RECRUITING_TEMPLATE_FORM_ID = "q4G14d";

export function tallyFormEditorUrl(formId: string): string {
  return `https://tally.so/forms/${encodeURIComponent(formId)}/edit`;
}
