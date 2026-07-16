import type { CostType } from "./travel-costs";

export type ClientTravelReceipt = {
  clientId: string;
  costType: CostType;
};

export function createClientReceiptId(): string {
  return crypto.randomUUID();
}

export function withoutClientReceiptId<T extends { clientId: string }>({
  clientId: _clientId,
  ...receipt
}: T): Omit<T, "clientId"> {
  return receipt;
}

export function getTravelReceiptLabel(
  receipts: readonly ClientTravelReceipt[],
  index: number,
  labels: Record<CostType, string>,
): string {
  const receipt = receipts[index];
  const label = labels[receipt.costType];
  const sameTypeCount = receipts.filter(
    (item) => item.costType === receipt.costType,
  ).length;

  if (sameTypeCount === 1) return label;

  const position = receipts
    .slice(0, index + 1)
    .filter((item) => item.costType === receipt.costType).length;
  return `${label} ${position}`;
}
