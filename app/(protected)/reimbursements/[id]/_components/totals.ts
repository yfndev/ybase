import type { ReceiptWithUrl } from "./types";

export function sumNet(receipts: ReceiptWithUrl[]): number {
  return receipts.reduce((sum, receipt) => sum + receipt.netAmount, 0);
}

export function sumGross(receipts: ReceiptWithUrl[]): number {
  return receipts.reduce((sum, receipt) => sum + receipt.grossAmount, 0);
}

export function taxForRate(receipts: ReceiptWithUrl[], rate: number): number {
  return receipts
    .filter((receipt) => receipt.taxRate === rate)
    .reduce((sum, receipt) => sum + receipt.grossAmount - receipt.netAmount, 0);
}
