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
