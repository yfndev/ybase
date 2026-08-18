export type MembershipResignationRequestStatus =
  | "pending_guardian"
  | "received";

export interface MembershipResignationRequest {
  _id: string;
  _creationTime: number;
  organizationId: string;
  membershipId: string;
  userId: string;
  status: MembershipResignationRequestStatus;
  declarationText: string;
  declarationVersion: number;
  requestedAt: number;
  requesterIpAddress?: string;
  requesterUserAgent?: string;
  receivedAt?: number;
  scheduledEndAt?: number;
  guardianName?: string;
  guardianEmail?: string;
  guardianTokenHash?: string;
  guardianConsentExpiresAt?: number;
  guardianConfirmedAt?: number;
  guardianIpAddress?: string;
  guardianUserAgent?: string;
  confirmationEmailSentAt?: number;
}
