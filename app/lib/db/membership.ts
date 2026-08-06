export type MembershipLegalStatus =
  | "active"
  | "resigning"
  | "suspended"
  | "ended";

export type MembershipEndReason =
  | "resignation"
  | "exclusion"
  | "age_limit"
  | "death";

export interface PostalAddress {
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

export type MembershipGender = "female" | "male" | "diverse";

export interface MembershipApplicationSignature {
  place: string;
  signedAt: number;
  signatureStorageKey: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface GuardianConsentEvidence {
  representativeName: string;
  representativeEmail: string;
  signedAt: number;
  signatureStorageKey?: string;
  completedPdfStorageKey?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface HandoverTask {
  _id: string;
  category:
    | "successor"
    | "responsibilities"
    | "files"
    | "shared_access"
    | "reimbursements"
    | "external_accounts";
  title: string;
  ownerUserId?: string;
  completedAt?: number;
  completedBy?: string;
}

export interface Membership {
  _id: string;
  _creationTime: number;
  organizationId: string;
  userId: string;
  applicationId: string;
  membershipNumber: string;
  isCurrent: boolean;
  legalStatus: MembershipLegalStatus;
  admittedAt: number;
  admissionEvidenceStorageKey?: string;
  guardianConsent?: GuardianConsentEvidence;
  privateEmail: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: MembershipGender;
  phone?: string;
  address?: PostalAddress;
  memberPlatformUserId?: string;
  applicationSignature?: MembershipApplicationSignature;
  profileConfirmedAt?: number;
  purposesConfirmedAt?: number;
  resignationReceivedAt?: number;
  scheduledEndAt?: number;
  scheduledEndReason?: Extract<
    MembershipEndReason,
    "resignation" | "age_limit"
  >;
  endedAt?: number;
  endReason?: MembershipEndReason;
  endEvidenceStorageKey?: string;
  rightsSuspendedAt?: number;
  handoverStartedAt?: number;
  handoverTasks: HandoverTask[];
  userLifecycleSyncedAt?: number;
  workspaceSuspendedAt?: number;
  workspaceSuspensionPendingAt?: number;
  workspaceSuspensionNotRequiredAt?: number;
  updatedAt: number;
}
