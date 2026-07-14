export type UserRole = "admin" | "finance" | "people_culture" | "member";
export type MemberStatus = "onboarding" | "active" | "offboarded";
export type TeamOnboardingStatus = "not_started" | "in_progress" | "completed";
export type ReimbursementType = "expense" | "travel";
export type ReviewStatus =
  | "pending"
  | "changes_requested"
  | "approved"
  | "declined";
export type CostType =
  | "car"
  | "train"
  | "flight"
  | "taxi"
  | "bus"
  | "accommodation";

export type { JobPosting, JobPostingStatus } from "./jobPosting";

export interface Organization {
  _id: string;
  _creationTime: number;
  name: string;
  domain: string;
  createdBy: string;
  street?: string;
  plz?: string;
  city?: string;
  accountingEmail?: string;
  careOf?: string;
  taxId?: string;
}

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
  memberStatus?: MemberStatus;
  teamOnboardingStatus?: TeamOnboardingStatus;
  registeredAt?: number;
  onboardedAt?: number;
  teamOnboardedAt?: number;
  offboardedAt?: number;
}

export interface Project {
  _id: string;
  _creationTime: number;
  name: string;
  travelDestination?: string;
  travelPurpose?: string;
  organizationId: string;
  isArchived: boolean;
  createdBy: string;
}

export type ProjectTravelDefaults = Pick<
  Project,
  "travelDestination" | "travelPurpose"
>;

export type { Department, Team } from "./orgStructureTypes";

export interface Reimbursement {
  _id: string;
  _creationTime: number;
  organizationId: string;
  projectId: string;
  amount: number;
  type: ReimbursementType;
  status: ReviewStatus;
  iban: string;
  bic?: string;
  accountHolder: string;
  rejectionNote?: string;
  reviewNote?: string;
  createdBy: string;
  reviewedBy?: string;
  reviewedAt?: number;
  currency?: string;
  signatureStorageId?: string;
  isSharedLink?: boolean;
  submitterName?: string;
  submitterEmail?: string;
  invitedName?: string;
  invitedEmail?: string;
  submittedExternally?: boolean;
  requestedExternally?: boolean;
  description?: string;
  pendingUploadKeys?: string[];
}

export interface TravelDetails {
  _id: string;
  _creationTime: number;
  reimbursementId: string;
  startDate: string;
  endDate: string;
  destination: string;
  purpose: string;
  isInternational: boolean;
  mealAllowanceDays?: number;
  mealAllowanceDailyBudget?: number;
  allowFoodAllowance?: boolean;
}

export interface Receipt {
  _id: string;
  _creationTime: number;
  reimbursementId: string;
  receiptNumber?: string;
  receiptDate: string;
  companyName: string;
  description: string;
  netAmount: number;
  taxRate: number;
  grossAmount: number;
  fileStorageId: string;
  costType?: CostType;
  kilometers?: number;
}

export interface Log {
  _id: string;
  _creationTime: number;
  organizationId: string;
  userId: string;
  action: string;
  entityId: string;
  details?: string;
}

export interface VolunteerAllowance {
  _id: string;
  _creationTime: number;
  organizationId: string;
  projectId: string;
  amount: number;
  status: ReviewStatus;
  iban: string;
  bic?: string;
  accountHolder: string;
  rejectionNote?: string;
  reviewNote?: string;
  createdBy: string;
  reviewedBy?: string;
  reviewedAt?: number;
  activityDescription: string;
  startDate: string;
  endDate: string;
  taxYear?: string;
  volunteerName: string;
  volunteerStreet: string;
  volunteerPlz: string;
  volunteerCity: string;
  signatureStorageId?: string;
  pendingSignatureStorageId?: string;
  isSharedLink?: boolean;
  submitterEmail?: string;
  invitedName?: string;
  invitedEmail?: string;
  submittedExternally?: boolean;
  requestedExternally?: boolean;
}

export interface SignatureToken {
  _id: string;
  _creationTime: number;
  token: string;
  organizationId: string;
  createdBy: string;
  expiresAt: number;
  signatureStorageId?: string;
  pendingSignatureStorageId?: string;
  usedAt?: number;
}
