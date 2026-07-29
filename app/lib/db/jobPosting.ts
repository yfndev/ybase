export type JobPostingStatus = "draft" | "published" | "closed" | "archived";
export type JobPostingUrgency = "normal" | "urgent";

export interface JobPosting {
  _id: string;
  _creationTime: number;
  organizationId: string;
  teamId: string;
  status: JobPostingStatus;
  urgency?: JobPostingUrgency;
  title: string;
  shortText?: string;
  description?: string;
  tasks?: string;
  requirements?: string;
  timeCommitment?: string;
  location?: string;
  isRemote?: boolean;
  deadline?: string;
  contactUserIds?: string[];
  applicationQuestions?: string[];
  createdBy: string;
  tallyFormId?: string;
  tallyWebhookId?: string;
  tallyFormError?: string;
  tallyClosed?: boolean;
}
