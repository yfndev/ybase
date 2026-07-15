export type UserRole = "admin" | "finance" | "people_culture" | "member";
export type MemberStatus = "onboarding" | "active" | "offboarded";
export type TeamOnboardingStatus = "not_started" | "in_progress" | "completed";

export interface User {
  _id: string;
  _creationTime: number;
  name?: string;
  image?: string;
  email?: string;
  emailVerificationTime?: number;
  phone?: string;
  phoneVerificationTime?: number;
  isAnonymous?: boolean;
  firstName?: string;
  lastName?: string;
  organizationId?: string;
  role?: UserRole;
  iban?: string;
  bic?: string;
  accountHolder?: string;
  teamId?: string;
  positionTitle?: string;
  memberStatus: MemberStatus;
  teamOnboardingStatus: TeamOnboardingStatus;
  registeredAt?: number;
  onboardedAt?: number;
  teamOnboardedAt?: number;
  offboardedAt?: number;
}
