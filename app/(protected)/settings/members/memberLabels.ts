import type {
  MemberStatus,
  TeamOnboardingStatus,
  UserRole,
} from "@/lib/db/types";

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

export const TEAM_ONBOARDING_OPTIONS: Option<TeamOnboardingStatus>[] = [
  { value: "not_started", label: "Nicht begonnen" },
  { value: "in_progress", label: "In Bearbeitung" },
  { value: "completed", label: "Abgeschlossen" },
];

export const ROLE_OPTIONS: Option<UserRole>[] = [
  { value: "admin", label: "Admin" },
  { value: "finance", label: "Finance" },
  { value: "people_culture", label: "People & Culture" },
  { value: "member", label: "Teammitglied" },
];
