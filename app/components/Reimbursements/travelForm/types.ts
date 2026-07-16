import type { MealAllowance, Receipt as ReceiptDoc } from "@/lib/db/types";
import type { CostType } from "@/lib/travel-costs";

export type BankDetails = { iban: string; bic: string; accountHolder: string };

export type Receipt = Omit<
  ReceiptDoc,
  "_id" | "_creationTime" | "reimbursementId"
> & { clientId: string; costType: CostType };

export type Travel = {
  destination: string;
  purpose: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  isInternational: boolean;
  mealAllowance: MealAllowance;
  overnightAllowanceNights: number;
  overnightAllowanceRate: number;
};
