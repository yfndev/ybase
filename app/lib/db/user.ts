export type UserRole = "admin" | "finance" | "people_culture" | "member";
export type MemberStatus =
  | "onboarding"
  | "getting_to_know"
  | "active"
  | "offboarding_planned"
  | "offboarding"
  | "archived"
  | "excluded";
export type StoredMemberStatus = MemberStatus | "offboarded";
export type TeamOnboardingStatus = "not_started" | "in_progress" | "completed";
export type ProfileImageSource = "google" | "upload";

export interface BoardMembership {
  departmentId: string;
  isChair: boolean;
}

export interface MemberInfraction {
  _id: string;
  reason: string;
  createdAt: number;
  createdBy: string;
}

export type GettingToKnowOutcome =
  | "confirmed"
  | "ended_by_org"
  | "ended_by_member";

export interface GettingToKnowPhase {
  startedAt: number;
  endsAt: number;
  reminderSentAt?: number;
  decidedAt?: number;
  decidedBy?: string;
  outcome?: GettingToKnowOutcome;
}

export interface User {
  _id: string;
  _creationTime: number;
  name?: string;
  image?: string;
  googlePhotoIsDefault?: boolean;
  publicProfileSetupRequired?: boolean;
  profileImageStorageKey?: string;
  profileImageContentType?: "image/jpeg" | "image/png";
  profileImageSource?: ProfileImageSource;
  publicProfileCompletedAt?: number;
  googleProfileImageSyncedAt?: number;
  email?: string;
  emailVerificationTime?: number;
  privateEmail?: string;
  phone?: string;
  phoneVerificationTime?: number;
  memberPlatformUserId?: string;
  memberPlatformSyncedAt?: number;
  isAnonymous?: boolean;
  firstName?: string;
  lastName?: string;
  googleWorkspaceUserId?: string;
  organizationId?: string;
  role?: UserRole;
  iban?: string;
  bic?: string;
  accountHolder?: string;
  teamId?: string;
  secondaryTeamId?: string;
  isTeamLead?: boolean;
  isSecondaryTeamLead?: boolean;
  boardMembership?: BoardMembership;
  applicationId?: string;
  membershipId?: string;
  memberStatus: StoredMemberStatus;
  gettingToKnow?: GettingToKnowPhase;
  teamOnboardingStatus: TeamOnboardingStatus;
  registeredAt?: number;
  onboardedAt?: number;
  teamOnboardedAt?: number;
  offboardingPlannedAt?: number;
  offboardingStartedAt?: number;
  archivedAt?: number;
  excludedAt?: number;
  offboardedAt?: number;
  memberInfractions?: MemberInfraction[];
}
