export type ApplicationStatus =
  | "received"
  | "review"
  | "interview"
  | "accepted"
  | "rejected"
  | "withdrawn";

export type ApplicationFieldValue =
  | string
  | number
  | boolean
  | null
  | ApplicationFieldValue[]
  | { [key: string]: ApplicationFieldValue };

export interface ApplicationField {
  key: string;
  label: string;
  type: string;
  value: ApplicationFieldValue;
}

export type ApplicationHistoryType = "status_changed" | "management_updated";

export interface ApplicationHistoryEntry {
  _id: string;
  timestamp: number;
  type: ApplicationHistoryType;
  actorUserId: string;
  details: string;
  fromStatus?: ApplicationStatus;
  toStatus?: ApplicationStatus;
}

export type ApplicationFileStatus =
  | "pending"
  | "importing"
  | "imported"
  | "rejected"
  | "failed";

export interface ApplicationFile {
  _id: string;
  fieldKey: string;
  fieldLabel: string;
  sourceId?: string;
  sourceUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
  status: ApplicationFileStatus;
  attempts: number;
  storageKey?: string;
  error?: string;
  importedAt?: number;
  updatedAt: number;
}

export type ApplicationFileView = Omit<
  ApplicationFile,
  "sourceUrl" | "storageKey"
>;

export interface Application {
  _id: string;
  _creationTime: number;
  organizationId: string;
  jobPostingId: string;
  status: ApplicationStatus;
  applicantName?: string;
  applicantEmail: string;
  applicantEmailNormalized: string;
  fields: ApplicationField[];
  files: ApplicationFile[];
  tallyEventId: string;
  tallySubmissionId: string;
  tallyResponseId: string;
  tallyFormId: string;
  withdrawalTokenHash?: string;
  submittedAt: number;
  withdrawnAt?: number;
  ownerId?: string;
  internalNotes?: string;
  interviewAt?: number;
  updatedAt?: number;
  history?: ApplicationHistoryEntry[];
}

export type ApplicationWithFiles = Omit<Application, "files"> & {
  files: ApplicationFileView[];
  jobPostingTitle: string;
};

export type TallyWebhookEventStatus = "processed" | "duplicate" | "ignored";

export interface TallyWebhookEvent {
  _id: string;
  _creationTime: number;
  eventType: string;
  submissionId: string;
  status: TallyWebhookEventStatus;
  jobPostingId?: string;
  organizationId?: string;
  applicationId?: string;
  reason?: string;
}
