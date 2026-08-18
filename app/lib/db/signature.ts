import type { ReimbursementStorageType } from "../s3/keys";
import type { SignatureUploadContext } from "../signatures/context";

export interface SignatureToken {
  _id: string;
  _creationTime: number;
  token: string;
  organizationId: string;
  createdBy: string;
  uploadContext?: SignatureUploadContext;
  reimbursementType?: ReimbursementStorageType;
  expiresAt: number;
  signatureStorageId?: string;
  pendingSignatureStorageId?: string;
  usedAt?: number;
}
