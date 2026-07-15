import type {
  MemberStatus,
  TeamOnboardingStatus,
  UserRole,
} from "@/lib/db/types";

type BadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "destructive"
  | "outline";

interface Option<T extends string> {
  value: T;
  label: string;
}

export const MEMBER_STATUS_OPTIONS: Option<MemberStatus>[] = [
  { value: "onboarding", label: "Im Onboarding" },
  { value: "active", label: "Freigegeben" },
  { value: "offboarded", label: "Ausgeschieden" },
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

const MEMBER_STATUS_VARIANT: Record<MemberStatus, BadgeVariant> = {
  onboarding: "default",
  active: "secondary",
  offboarded: "outline",
};

const TEAM_ONBOARDING_VARIANT: Record<TeamOnboardingStatus, BadgeVariant> = {
  not_started: "outline",
  in_progress: "default",
  completed: "secondary",
};

function labelOf<T extends string>(options: Option<T>[], value: T): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export const memberStatusLabel = (status: MemberStatus) =>
  labelOf(MEMBER_STATUS_OPTIONS, status);

export const teamOnboardingLabel = (status: TeamOnboardingStatus) =>
  labelOf(TEAM_ONBOARDING_OPTIONS, status);

export const memberStatusVariant = (status: MemberStatus): BadgeVariant =>
  MEMBER_STATUS_VARIANT[status];

export const teamOnboardingVariant = (
  status: TeamOnboardingStatus,
): BadgeVariant => TEAM_ONBOARDING_VARIANT[status];
