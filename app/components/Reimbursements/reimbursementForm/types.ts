import type { Project, Receipt as ReceiptDoc } from "@/lib/db/types";

export type BankDetails = { iban: string; bic: string; accountHolder: string };

export type Receipt = Omit<
  ReceiptDoc,
  "_id" | "_creationTime" | "reimbursementId" | "costType" | "kilometers"
>;

export type Draft = {
  company: string;
  number: string;
  desc: string;
  date: string;
  gross: number;
  tax: number;
  file: string | null;
};

export interface Props {
  defaultBankDetails: BankDetails;
  projects: Project[];
  organizationName: string;
}
