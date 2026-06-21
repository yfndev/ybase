import { COST_LABELS, type CostType } from "@/lib/travel-costs";
import { dateFmt } from "./primitives";

export type Organization = {
  name: string;
  careOf: string;
  street: string;
  plz: string;
  city: string;
  taxId: string;
  accountingEmail: string;
};

export type ReimbursementInput = {
  type: "expense" | "travel";
  accountHolder?: string;
  submitterName?: string;
  amount?: number;
  iban?: string;
  bic?: string;
  _creationTime?: number;
  signatureUrl?: string | null;
  organization?: Partial<Organization>;
  travelDetails?: {
    mealAllowanceDays?: number;
    mealAllowanceDailyBudget?: number;
  } | null;
};

export type ReceiptInput = {
  receiptNumber?: string;
  receiptDate?: string;
  companyName?: string;
  description?: string;
  netAmount?: number;
  taxRate?: number;
  grossAmount?: number;
  costType?: CostType;
  kilometers?: number;
  fileUrl?: string | null;
};

export type ReimbursementData = {
  type: "expense" | "travel";
  accountHolder: string;
  amount: number;
  iban: string;
  bic?: string;
  createdAt?: number;
  organization: Organization;
  signatureBytes?: Uint8Array | null;
};

export type LineItem = {
  nr: string;
  date: string;
  company: string;
  description: string;
  net: number;
  tax7: number;
  tax19: number;
  gross: number;
};

export type Totals = {
  net: number;
  tax0: number;
  tax7: number;
  tax19: number;
  gross: number;
};

export const EMPTY_ORG: Organization = {
  name: "",
  careOf: "",
  street: "",
  plz: "",
  city: "",
  taxId: "",
  accountingEmail: "",
};

function receiptDescription(receipt: ReceiptInput): string {
  const costLabel = receipt.costType ? COST_LABELS[receipt.costType] : "";
  const parts = [costLabel, receipt.description].filter(Boolean);
  if (receipt.costType === "car" && receipt.kilometers) {
    parts.push(`${receipt.kilometers} km × 0,30 €`);
  }
  return parts.join(" – ");
}

export function buildLineItems(
  reimbursement: ReimbursementInput,
  receipts: ReceiptInput[],
): LineItem[] {
  const items: LineItem[] = receipts.map((receipt, index) => {
    const net = receipt.netAmount || 0;
    const gross = receipt.grossAmount || 0;
    const tax = gross - net;
    return {
      nr: receipt.receiptNumber || String(index + 1),
      date: dateFmt(receipt.receiptDate),
      company: receipt.companyName || "",
      description: receiptDescription(receipt),
      net,
      tax7: receipt.taxRate === 7 ? tax : 0,
      tax19: receipt.taxRate === 19 ? tax : 0,
      gross,
    };
  });

  const travel = reimbursement.travelDetails;
  if (reimbursement.type === "travel" && travel?.mealAllowanceDays) {
    const mealTotal =
      travel.mealAllowanceDays * (travel.mealAllowanceDailyBudget || 0);
    items.push({
      nr: "",
      date: "",
      company: "Verpflegungspauschale",
      description: `${travel.mealAllowanceDays} Tage`,
      net: mealTotal,
      tax7: 0,
      tax19: 0,
      gross: mealTotal,
    });
  }
  return items;
}

export function buildTotals(items: LineItem[]): Totals {
  const totals: Totals = { net: 0, tax0: 0, tax7: 0, tax19: 0, gross: 0 };
  for (const item of items) {
    totals.net += item.net;
    totals.tax7 += item.tax7;
    totals.tax19 += item.tax19;
    totals.gross += item.gross;
  }
  totals.tax0 = totals.gross - totals.net - totals.tax7 - totals.tax19;
  return totals;
}
