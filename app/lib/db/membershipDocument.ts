export type MembershipDocumentKind =
  | "bylaws"
  | "code_of_conduct"
  | "privacy_notice"
  | "usage_rights"
  | "optional_consent";

export type DocumentExecutionType =
  | "signature"
  | "acknowledgement"
  | "optional_consent";

export interface DocumentVersion {
  _id: string;
  _creationTime: number;
  organizationId: string;
  kind: MembershipDocumentKind;
  title: string;
  versionLabel: string;
  sourceUrl: string;
  snapshotStorageKey: string;
  sha256: string;
  publishedAt: number;
  publishedBy: string;
  targetTeamIds: string[];
  targetDepartmentIds: string[];
  executionType: DocumentExecutionType;
  isActive: boolean;
}

export interface DocumentExecution {
  _id: string;
  _creationTime: number;
  organizationId: string;
  documentVersionId: string;
  documentHash: string;
  membershipId: string;
  userId: string;
  status: "assigned" | "completed" | "revoked";
  assignedAt: number;
  processingStartedAt?: number;
  completedAt?: number;
  signatureStorageKey?: string;
  completedPdfStorageKey?: string;
  paperEvidenceStorageKey?: string;
  ipAddress?: string;
  userAgent?: string;
  revokedAt?: number;
}
