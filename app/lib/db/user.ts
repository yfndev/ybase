export type UserRole = "admin" | "finance" | "people_culture" | "member";
export type MemberStatus = "onboarding" | "active" | "inactive" | "offboarded";
export type TeamOnboardingStatus = "not_started" | "in_progress" | "completed";
export type ProfileImageSource = "google" | "upload";

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
  applicationId?: string;
  memberStatus: MemberStatus;
  teamOnboardingStatus: TeamOnboardingStatus;
  registeredAt?: number;
  onboardedAt?: number;
  teamOnboardedAt?: number;
  offboardedAt?: number;
}
