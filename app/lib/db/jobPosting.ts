export type JobPostingStatus = "draft" | "published" | "closed" | "archived";

export interface JobPosting {
  _id: string;
  _creationTime: number;
  organizationId: string;
  teamId: string;
  status: JobPostingStatus;
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
  createdBy: string;
  tallyFormId?: string;
  tallyWebhookId?: string;
  tallyFormError?: string;
  tallyClosed?: boolean;
}
