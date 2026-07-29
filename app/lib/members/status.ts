import type { MemberStatus } from "../db/types";

export const PUBLIC_MEMBER_STATUSES = [
  "active",
  "offboarding_planned",
] as const satisfies readonly MemberStatus[];

export const UNAVAILABLE_MEMBER_STATUSES = [
  "offboarding",
  "archived",
  "offboarded",
] as const satisfies readonly MemberStatus[];

export function normalizeMemberStatus(status: MemberStatus): MemberStatus {
  return status === "offboarded" ? "archived" : status;
}

export function isPublicMemberStatus(status: MemberStatus): boolean {
  return PUBLIC_MEMBER_STATUSES.some((value) => value === status);
}

export function isUnavailableMemberStatus(status: MemberStatus): boolean {
  return UNAVAILABLE_MEMBER_STATUSES.some((value) => value === status);
}
