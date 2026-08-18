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
