export const REIMBURSEMENT_STORAGE_TYPES = [
  "expense",
  "travel",
  "volunteer-allowance",
] as const;

export type ReimbursementStorageType =
  (typeof REIMBURSEMENT_STORAGE_TYPES)[number];
export type ReimbursementDocumentType = "receipt" | "signature";

const DOCUMENT_DIRECTORIES: Record<ReimbursementDocumentType, string> = {
  receipt: "receipts",
  signature: "signatures",
};

function assertSafePathSegment(value: string, name: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    throw new Error(`Invalid ${name}`);
  }
}

export function profileImageUploadDirectory(userId: string): string {
  assertSafePathSegment(userId, "user ID");
  return `profile-images/${userId}`;
}

export function reimbursementUploadDirectory(
  type: ReimbursementStorageType,
  organizationId: string,
  documentType: ReimbursementDocumentType,
): string {
  assertSafePathSegment(organizationId, "organization ID");
  return `reimbursements/${type}/${organizationId}/${DOCUMENT_DIRECTORIES[documentType]}`;
}

export function membershipDocumentDirectory(
  organizationId: string,
  documentVersionId: string,
): string {
  assertSafePathSegment(organizationId, "organization ID");
  assertSafePathSegment(documentVersionId, "document version ID");
  return `memberships/${organizationId}/documents/${documentVersionId}`;
}

export function membershipExecutionDirectory(
  organizationId: string,
  executionId: string,
): string {
  assertSafePathSegment(organizationId, "organization ID");
  assertSafePathSegment(executionId, "document execution ID");
  return `memberships/${organizationId}/executions/${executionId}`;
}
