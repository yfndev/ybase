import { createBankReferenceId, parseGermanDate } from "./helpers";
import type { TransactionData } from "./types";

export function mapFinom(row: Record<string, string>): TransactionData {
  const bookingDate = row.Buchungsdatum || "";
  const counterparty = row["Auftraggeber/Empfänger"] || "";
  const description = row.Verwendungszweck || "";
  const transactionId = row["Transaktions-ID"] || "";
  const amount = row.Zahlungsbetrag || "0";
  return {
    date: bookingDate ? parseGermanDate(bookingDate, false) : Date.now(),
    amount: parseFloat(amount.replace(",", ".")) || 0,
    description: description || counterparty,
    counterparty,
    bankReferenceId: transactionId
      ? `finom:${transactionId}`
      : createBankReferenceId("finom", [bookingDate, amount, counterparty]),
    accountName: row["Wallet-Name"] || "",
    currency: row.Zahlungswährung || "EUR",
  };
}
