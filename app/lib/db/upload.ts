export type UploadContextType =
  | "user"
  | "profileImage"
  | "reimbursement"
  | "allowance"
  | "signatureToken";

export interface UploadOwnership {
  _id: string;
  _creationTime: number;
  organizationId: string;
  userId: string;
  contextType: UploadContextType;
  contextId: string;
  claimedByType?:
    | "profileImage"
    | "reimbursement"
    | "allowance"
    | "signatureToken";
  claimedById?: string;
  claimedAt?: number;
}
