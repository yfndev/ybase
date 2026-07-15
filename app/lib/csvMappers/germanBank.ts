import {
  createBankReferenceId,
  parseGermanAmount,
  parseGermanDate,
} from "./helpers";
import type { TransactionData } from "./types";

const DATE_TIME_PATTERN = /DATUM\s+\d{2}\.\d{2}\.\d{4},\s+\d{2}\.\d{2}\s+UHR/gi;
const SENSITIVE_DATA_PATTERN = /(?:CRED|IBAN|BIC|MREF):\s*[A-Z0-9]+/gi;

export function mapGermanBank(
  row: Record<string, string>,
  source: "sparkasse" | "volksbank",
): TransactionData {
  const buchungstag = row.Buchungstag || "";
  const verwendungszweck = row.Verwendungszweck || "";
  const buchungstext = row.Buchungstext || "";
  const betrag = row.Betrag || "0";
  const counterpartyField =
    source === "sparkasse"
      ? "Beguenstigter/Zahlungspflichtiger"
      : "Name Zahlungsbeteiligter";
  const accountField =
    source === "sparkasse" ? "Auftragskonto" : "Bezeichnung Auftragskonto";
  const counterparty = row[counterpartyField] || "";
  const pattern =
    source === "sparkasse" ? DATE_TIME_PATTERN : SENSITIVE_DATA_PATTERN;
  const description = (verwendungszweck || buchungstext)
    .replace(pattern, "")
    .replace(/\s+/g, " ")
    .trim();
  return {
    date: buchungstag
      ? parseGermanDate(buchungstag, source === "sparkasse")
      : Date.now(),
    amount: parseGermanAmount(betrag),
    description,
    counterparty,
    bankReferenceId: createBankReferenceId(source, [
      buchungstag,
      betrag,
      counterparty,
      verwendungszweck,
    ]),
    accountName: row[accountField] || "",
  };
}
