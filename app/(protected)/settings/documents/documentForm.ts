import type { PublishableMembershipDocumentKind } from "@/lib/members/documents";

export type EditableMembershipDocument = {
  id: string;
  kind: PublishableMembershipDocumentKind;
  title: string;
  versionLabel: string;
  content: string;
  targetTeamIds: string[];
  targetDepartmentIds: string[];
  hasAssignments: boolean;
};

export function suggestNextVersionLabel(current: string): string {
  const match = current.match(/^(.*?)(\d+)$/);
  if (!match) return `${current}-2`;
  const [, prefix, digits] = match;
  return `${prefix}${String(Number(digits) + 1).padStart(digits.length, "0")}`;
}
