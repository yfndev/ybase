import type { ReimbursementStorageType } from "../s3/keys";

export interface SignatureToken {
  _id: string;
  _creationTime: number;
  token: string;
  organizationId: string;
  createdBy: string;
  reimbursementType?: ReimbursementStorageType;
  expiresAt: number;
  signatureStorageId?: string;
  pendingSignatureStorageId?: string;
  usedAt?: number;
}
