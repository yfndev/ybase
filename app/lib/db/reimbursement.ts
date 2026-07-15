import type { CostType, MealAllowance } from "./travelTypes";

export type ReimbursementType = "expense" | "travel";
export type ReviewStatus =
  | "pending"
  | "changes_requested"
  | "approved"
  | "declined";
export interface Reimbursement {
  _id: string;
  _creationTime: number;
  organizationId: string;
  projectId: string;
  amount: number;
  type: ReimbursementType;
  status: ReviewStatus;
  iban: string;
  bic?: string;
  accountHolder: string;
  rejectionNote?: string;
  reviewNote?: string;
  createdBy: string;
  reviewedBy?: string;
  reviewedAt?: number;
  currency?: string;
  signatureStorageId?: string;
  isSharedLink?: boolean;
  submitterName?: string;
  submitterEmail?: string;
  invitedName?: string;
  invitedEmail?: string;
  submittedExternally?: boolean;
  requestedExternally?: boolean;
  pendingUploadKeys?: string[];
  submittedAt?: number;
}

export interface TravelDetails {
  _id: string;
  _creationTime: number;
  reimbursementId: string;
  startDate: string;
  startTime?: string;
  endDate: string;
  endTime?: string;
  destination: string;
  purpose: string;
  isInternational: boolean;
  mealAllowanceDays?: number;
  mealAllowanceDailyBudget?: number;
  mealAllowance?: MealAllowance;
  overnightAllowanceNights?: number;
  overnightAllowanceRate?: number;
  allowFoodAllowance?: boolean;
}

export interface Receipt {
  _id: string;
  _creationTime: number;
  reimbursementId: string;
  receiptNumber?: string;
  receiptDate: string;
  companyName: string;
  description: string;
  netAmount: number;
  taxRate: number;
  grossAmount: number;
  fileStorageId: string;
  costType?: CostType;
  kilometers?: number;
}
