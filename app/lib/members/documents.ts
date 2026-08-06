import type {
  DocumentExecutionType,
  MembershipDocumentKind,
} from "../db/types";

export const MEMBERSHIP_DOCUMENT_ORDER = [
  "privacy_notice",
  "usage_rights",
  "bylaws",
  "code_of_conduct",
  "optional_consent",
] as const satisfies readonly MembershipDocumentKind[];

export const DOCUMENT_EXECUTION_TYPE = {
  privacy_notice: "acknowledgement",
  usage_rights: "signature",
  bylaws: "acknowledgement",
  code_of_conduct: "signature",
  optional_consent: "optional_consent",
} as const satisfies Record<MembershipDocumentKind, DocumentExecutionType>;

export const MEMBERSHIP_DOCUMENT_LABELS = {
  privacy_notice: "Interne Datenschutzerklärung",
  usage_rights: "Sondervereinbarung Arbeitsergebnisse",
  bylaws: "Satzung",
  code_of_conduct: "Code of Conduct",
  optional_consent: "Freiwillige Einwilligung",
} as const satisfies Record<MembershipDocumentKind, string>;

export const DOCUMENT_STEP_DESCRIPTIONS = {
  signature: "Lies die Unterlage vollständig und unterschreibe sie unten.",
  acknowledgement:
    "Lies die Unterlage vollständig und bestätige unten deine Kenntnisnahme.",
  optional_consent:
    "Diese Einwilligung ist freiwillig. Mit beiden Antworten kommst du weiter.",
} as const satisfies Record<DocumentExecutionType, string>;

export function documentOrderIndex(kind: MembershipDocumentKind): number {
  return MEMBERSHIP_DOCUMENT_ORDER.indexOf(kind);
}
