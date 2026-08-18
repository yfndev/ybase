import {
  REIMBURSEMENT_STORAGE_TYPES,
  type ReimbursementStorageType,
} from "../s3/keys";

export const MEMBERSHIP_ONBOARDING_SIGNATURE_CONTEXT =
  "membership-onboarding" as const;

export const SIGNATURE_UPLOAD_CONTEXTS = [
  ...REIMBURSEMENT_STORAGE_TYPES,
  MEMBERSHIP_ONBOARDING_SIGNATURE_CONTEXT,
] as const;

export type SignatureUploadContext =
  | ReimbursementStorageType
  | typeof MEMBERSHIP_ONBOARDING_SIGNATURE_CONTEXT;

export function isReimbursementSignatureContext(
  context: SignatureUploadContext,
): context is ReimbursementStorageType {
  return context !== MEMBERSHIP_ONBOARDING_SIGNATURE_CONTEXT;
}
