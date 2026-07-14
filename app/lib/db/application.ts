export type ApplicationStatus =
  | "received"
  | "review"
  | "interview"
  | "accepted"
  | "rejected"
  | "withdrawn";

export type ApplicationFieldValue = string | number | boolean | string[] | null;

export interface ApplicationField {
  key: string;
  label: string;
  type: string;
  value: ApplicationFieldValue;
}

export interface Application {
  _id: string;
  _creationTime: number;
  organizationId: string;
  jobPostingId: string;
  status: ApplicationStatus;
  applicantName?: string;
  applicantEmail: string;
  applicantEmailNormalized: string;
  applicantPhone?: string;
  fields: ApplicationField[];
  tallyEventId: string;
  tallySubmissionId: string;
  tallyResponseId: string;
  tallyFormId: string;
  submittedAt: number;
}

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
