import type { ReviewStatus } from "./reimbursement";

export interface VolunteerAllowance {
  _id: string;
  _creationTime: number;
  organizationId: string;
  projectId: string;
  amount: number;
  status: ReviewStatus;
  iban: string;
  bic?: string;
  accountHolder: string;
  rejectionNote?: string;
  reviewNote?: string;
  createdBy: string;
  reviewedBy?: string;
  reviewedAt?: number;
  paidBy?: string;
  paidAt?: number;
  activityDescription: string;
  startDate: string;
  endDate: string;
  taxYear?: string;
  volunteerName: string;
  volunteerStreet: string;
  volunteerPlz: string;
  volunteerCity: string;
  signatureStorageId?: string;
  pendingSignatureStorageId?: string;
  isSharedLink?: boolean;
  submitterEmail?: string;
  invitedName?: string;
  invitedEmail?: string;
  submittedExternally?: boolean;
  requestedExternally?: boolean;
}
