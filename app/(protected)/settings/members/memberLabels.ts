import type { MemberStatus, UserRole } from "@/lib/db/types";

interface Option<T extends string> {
  value: T;
  label: string;
}

const ONBOARDING_STATUS_OPTION: Option<MemberStatus> = {
  value: "onboarding",
  label: "Onboarding",
};

const MEMBER_STATUS_OPTIONS: Option<MemberStatus>[] = [
  { value: "active", label: "Vereinsmitglied" },
  { value: "inactive", label: "Inaktiv" },
  { value: "offboarding_planned", label: "Offboarding vorgemerkt" },
  { value: "offboarding", label: "Offboarding" },
  { value: "archived", label: "Archiviert" },
];

export function memberStatusOptions(
  currentStatus: MemberStatus,
): Option<MemberStatus>[] {
  return currentStatus === "onboarding"
    ? [ONBOARDING_STATUS_OPTION, ...MEMBER_STATUS_OPTIONS]
    : MEMBER_STATUS_OPTIONS;
}

export const ROLE_OPTIONS: Option<UserRole>[] = [
  { value: "admin", label: "Admin" },
  { value: "finance", label: "Finance" },
  { value: "people_culture", label: "People & Culture" },
  { value: "member", label: "Teammitglied" },
];
