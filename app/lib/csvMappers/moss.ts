import { createBankReferenceId } from "./helpers";
import type { TransactionData } from "./types";

function parseMossDate(dateString: string): number {
  const parts = dateString.split(/[/-]/);
  if (parts.length !== 3) return Date.now();
  const first = parseInt(parts[0], 10);
  const second = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  if (first <= 12 && second <= 31) {
    return new Date(year, first - 1, second).getTime();
  }
  if (first <= 31 && second <= 12) {
    return new Date(year, second - 1, first).getTime();
  }
  return Date.now();
}

export function mapMoss(row: Record<string, string>): TransactionData {
  const dateValue =
    row["Payment Date"] || row["Payment date"] || row.date || row.Date || "";
  const mossId = row["Transaction ID"] || row["transaction id"] || row.id || "";
  const amount = row.Amount || row.amount || "0";
  return {
    date: dateValue ? parseMossDate(dateValue) : Date.now(),
    amount: parseFloat(amount),
    description:
      row.Note ||
      row["Merchant and Card Description"] ||
      row.Description ||
      row.description ||
      "",
    counterparty:
      row["Merchant Name"] || row["Merchant name"] || row.merchant || "",
    bankReferenceId: mossId
      ? `moss:${mossId}`
      : createBankReferenceId("moss", [dateValue, amount]),
    accountName: row.Cardholder || row.cardholder || row.account || "",
  };
}
