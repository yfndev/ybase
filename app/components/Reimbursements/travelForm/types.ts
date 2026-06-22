import type { Receipt as ReceiptDoc } from "@/lib/db/types";
import type { CostType } from "@/lib/travel-costs";

export type BankDetails = { iban: string; bic: string; accountHolder: string };

export type Receipt = Omit<
  ReceiptDoc,
  "_id" | "_creationTime" | "reimbursementId"
> & { costType: CostType };

export type Travel = {
  destination: string;
  purpose: string;
  startDate: string;
  endDate: string;
  isInternational: boolean;
  mealDays: number;
  mealRate: number;
};
