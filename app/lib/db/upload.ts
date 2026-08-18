export type UploadContextType =
  | "user"
  | "profileImage"
  | "reimbursement"
  | "allowance"
  | "signatureToken";

export type UploadClaimType =
  | "profileImage"
  | "reimbursement"
  | "allowance"
  | "signatureToken"
  | "membershipDocument"
  | "membershipApplication";

export interface UploadOwnership {
  _id: string;
  _creationTime: number;
  organizationId: string;
  userId: string;
  contextType: UploadContextType;
  contextId: string;
  claimedByType?: UploadClaimType;
  claimedById?: string;
  claimedAt?: number;
}
