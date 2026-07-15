export type UploadContextType =
  | "user"
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
  claimedByType?: "reimbursement" | "allowance" | "signatureToken";
  claimedById?: string;
  claimedAt?: number;
}
