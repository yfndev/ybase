import type { Receipt } from "./types";

export const sumGross = (receipts: Receipt[]) =>
  receipts.reduce((sum, receipt) => sum + receipt.grossAmount, 0);

export const sumNet = (receipts: Receipt[]) =>
  receipts.reduce((sum, receipt) => sum + receipt.netAmount, 0);

export const taxForRate = (receipts: Receipt[], rate: number) =>
  receipts
    .filter((receipt) => receipt.taxRate === rate)
    .reduce((sum, receipt) => sum + receipt.grossAmount - receipt.netAmount, 0);
