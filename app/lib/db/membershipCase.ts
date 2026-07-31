import type { LegalDelivery } from "./legalDelivery";

export type MembershipCaseType = "warning" | "exclusion";

export type MembershipCaseStatus =
  | "open"
  | "delivery_pending"
  | "objection_pending"
  | "closed";

export type ExclusionDecision = "excluded" | "dismissed";

export type ObjectionOutcome = "confirmed" | "overturned";

export interface MembershipCase {
  _id: string;
  _creationTime: number;
  organizationId: string;
  membershipId: string;
  userId: string;
  type: MembershipCaseType;
  status: MembershipCaseStatus;
  reason: string;
  warningSequence?: number;
  decision?: ExclusionDecision;
  decidedAt?: number;
  decisionDelivery?: LegalDelivery;
  objectionTokenHash?: string;
  objectionExpiresAt?: number;
  objectedAt?: number;
  objectionText?: string;
  objectionOutcome?: ObjectionOutcome;
  objectionDecidedAt?: number;
  closedAt?: number;
  updatedAt: number;
}
