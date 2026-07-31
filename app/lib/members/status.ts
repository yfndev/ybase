import type { MemberStatus, StoredMemberStatus } from "../db/types";

export const PUBLIC_MEMBER_STATUSES = [
  "active",
  "offboarding_planned",
] as const satisfies readonly MemberStatus[];

export const UNAVAILABLE_MEMBER_STATUSES = [
  "offboarding",
  "archived",
  "excluded",
  "offboarded",
] as const satisfies readonly StoredMemberStatus[];

export function normalizeMemberStatus(
  status: StoredMemberStatus,
): MemberStatus {
  return status === "offboarded" ? "archived" : status;
}

export function isPublicMemberStatus(status: StoredMemberStatus): boolean {
  return PUBLIC_MEMBER_STATUSES.some(
    (value) => value === normalizeMemberStatus(status),
  );
}

export function isUnavailableMemberStatus(status: StoredMemberStatus): boolean {
  return UNAVAILABLE_MEMBER_STATUSES.some((value) => value === status);
}
