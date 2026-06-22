import type {
  getReceipts,
  getReimbursement,
} from "@/lib/server/reimbursements/data";

export type Reimbursement = NonNullable<
  Awaited<ReturnType<typeof getReimbursement>>
>;

export type Receipt = Awaited<ReturnType<typeof getReceipts>>[number];

export type ReceiptWithUrl = Receipt & { fileUrl: string };
