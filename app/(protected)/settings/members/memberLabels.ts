import type { MemberStatus, UserRole } from "@/lib/db/types";

interface Option<T extends string> {
  value: T;
  label: string;
}

export const MEMBER_STATUS_OPTIONS: Option<MemberStatus>[] = [
  { value: "onboarding", label: "Onboarding" },
  { value: "active", label: "Vereinsmitglied" },
  { value: "inactive", label: "Inaktiv" },
  { value: "offboarded", label: "Offboarded" },
];

export const ROLE_OPTIONS: Option<UserRole>[] = [
  { value: "admin", label: "Admin" },
  { value: "finance", label: "Finance" },
  { value: "people_culture", label: "People & Culture" },
  { value: "member", label: "Teammitglied" },
];
