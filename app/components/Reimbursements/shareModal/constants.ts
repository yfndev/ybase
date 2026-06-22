import type { FormState, LinkKind, LinkType } from "./types";

export const INITIAL_FORM: FormState = {
  projectId: null,
  description: "",
  startDate: "",
  endDate: "",
  destination: "",
  purpose: "",
  allowFoodAllowance: false,
};

export const TYPE_LABELS: Record<LinkType, string> = {
  expense: "Auslagenerstattung",
  travel: "Reisekostenerstattung",
  allowance: "Ehrenamtspauschale",
};

export function linkUrl(linkType: LinkKind, id: string): string {
  const segment =
    linkType === "allowance" ? "ehrenamtspauschale" : "erstattung";
  return `${window.location.origin}/${segment}/${id}`;
}
