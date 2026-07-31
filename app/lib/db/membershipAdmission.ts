export interface GuardianConsent {
  representativeName: string;
  representativeEmail: string;
  tokenHash: string;
  expiresAt: number;
  lastSentAt?: number;
  signingStartedAt?: number;
  signedAt?: number;
  signatureStorageKey?: string;
  completedPdfStorageKey?: string;
  ipAddress?: string;
  userAgent?: string;
}

export type GuardianConsentView = Pick<
  GuardianConsent,
  | "representativeName"
  | "representativeEmail"
  | "expiresAt"
  | "lastSentAt"
  | "signedAt"
>;

export interface AdmissionDecision {
  result: "admitted" | "rejected";
  decidedAt: number;
  decidedBy: string;
  authority: "board_member" | "delegate";
  authorityEvidenceStorageKey?: string;
  reason?: string;
  recordedAt: number;
  recordedBy: string;
}

export interface AdmissionAppealDecision {
  result: "admitted" | "rejected";
  decidedAt: number;
  recordedAt: number;
  recordedBy: string;
  evidenceStorageKey?: string;
}
