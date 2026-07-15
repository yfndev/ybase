export interface TransactionData {
  date: number;
  amount: number;
  description: string;
  counterparty: string;
  bankReferenceId: string;
  accountName?: string;
  currency?: string;
}

export type ImportSource = "moss" | "sparkasse" | "volksbank" | "finom";
