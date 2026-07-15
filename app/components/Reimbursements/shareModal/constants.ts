import type { FormState, LinkKind, LinkType } from "./types";

export const DEFAULT_LINK_TYPE: LinkType = "travel";

export const INITIAL_FORM: FormState = {
  projectId: null,
  description: "",
  startDate: "",
  endDate: "",
  destination: "",
  purpose: "",
  allowFoodAllowance: false,
  invitedName: "",
  invitedEmail: "",
};

export const TYPE_LABELS: Record<LinkType, string> = {
  travel: "Reisekostenerstattung",
  expense: "Auslagenerstattung",
  allowance: "Ehrenamtspauschale",
};

export function linkUrl(linkType: LinkKind, id: string): string {
  const segment =
    linkType === "allowance" ? "ehrenamtspauschale" : "erstattung";
  return `${window.location.origin}/${segment}/${id}`;
}
