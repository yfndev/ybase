export interface TransactionData {
  date: number;
  amount: number;
  description: string;
  counterparty: string;
  bankReferenceId: string;
  accountName?: string;
  currency?: string;
}

type ImportSource = "moss" | "sparkasse" | "volksbank" | "finom";

const DATE_TIME_PATTERN = /DATUM\s+\d{2}\.\d{2}\.\d{4},\s+\d{2}\.\d{2}\s+UHR/gi;
const SENSITIVE_DATA_PATTERN = /(?:CRED|IBAN|BIC|MREF):\s*[A-Z0-9]+/gi;

function parseGermanDate(dateString: string, addCentury: boolean): number {
  const parts = dateString.split(".");
  if (parts.length !== 3) return Date.now();

  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const year = parseInt(parts[2]) + (addCentury ? 2000 : 0);

  return new Date(year, month - 1, day).getTime();
}

function parseMossDate(dateString: string): number {
  const parts = dateString.split(/[/-]/);
  if (parts.length !== 3) return Date.now();

  const first = parseInt(parts[0]);
  const second = parseInt(parts[1]);
  const year = parseInt(parts[2]);

  if (first <= 12 && second <= 31)
    return new Date(year, first - 1, second).getTime();
  if (first <= 31 && second <= 12)
    return new Date(year, second - 1, first).getTime();

  return Date.now();
}

function parseGermanAmount(amount: string): number {
  return parseFloat(amount.replace(/\./g, "").replace(",", ".")) || 0;
}

function createBankReferenceId(
  source: ImportSource,
  parts: string[],
): string {
  const filled = parts.filter(Boolean);
  if (filled.length > 0) {
    return `${source}:${filled.join(":")}`.replace(/[^a-zA-Z0-9:\-_.]/g, "_");
  }
  return `${source}:${Date.now()}-${Math.random()}`;
}

function cleanDescription(
  text: string,
  source: "sparkasse" | "volksbank",
): string {
  const pattern =
    source === "sparkasse" ? DATE_TIME_PATTERN : SENSITIVE_DATA_PATTERN;
  return text.replace(pattern, "").replace(/\s+/g, " ").trim();
}

function mapMoss(row: Record<string, string>): TransactionData {
  const dateValue =
    row["Payment Date"] || row["Payment date"] || row.date || row.Date || "";
  const mossId =
    row["Transaction ID"] || row["transaction id"] || row.id || "";

  return {
    date: dateValue ? parseMossDate(dateValue) : Date.now(),
    amount: parseFloat(row["Amount"] || row.amount || "0"),
    description:
      row["Note"] ||
      row["Merchant and Card Description"] ||
      row["Description"] ||
      row.description ||
      "",
    counterparty:
      row["Merchant Name"] || row["Merchant name"] || row.merchant || "",
    bankReferenceId: mossId
      ? `moss:${mossId}`
      : createBankReferenceId("moss", [dateValue, row["Amount"] || row.amount || ""]),
    accountName: row["Cardholder"] || row.cardholder || row.account || "",
  };
}

function mapGermanBank(
  row: Record<string, string>,
  source: "sparkasse" | "volksbank",
): TransactionData {
  const buchungstag = row["Buchungstag"] || "";
  const verwendungszweck = row["Verwendungszweck"] || "";
  const buchungstext = row["Buchungstext"] || "";
  const betrag = row["Betrag"] || "0";

  const counterpartyField =
    source === "sparkasse"
      ? "Beguenstigter/Zahlungspflichtiger"
      : "Name Zahlungsbeteiligter";

  const accountField =
    source === "sparkasse" ? "Auftragskonto" : "Bezeichnung Auftragskonto";

  const counterparty = row[counterpartyField] || "";

  return {
    date: buchungstag
      ? parseGermanDate(buchungstag, source === "sparkasse")
      : Date.now(),
    amount: parseGermanAmount(betrag),
    description: cleanDescription(verwendungszweck || buchungstext, source),
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

function mapFinom(row: Record<string, string>): TransactionData {
  const buchungsdatum = row["Buchungsdatum"] || "";
  const counterparty = row["Auftraggeber/Empfänger"] || "";
  const verwendungszweck = row["Verwendungszweck"] || "";
  const transactionId = row["Transaktions-ID"] || "";
  const walletName = row["Wallet-Name"] || "";
  const paymentAmount = row["Zahlungsbetrag"] || "0";
  const paymentCurrency = row["Zahlungswährung"] || "EUR";

  return {
    date: buchungsdatum
      ? parseGermanDate(buchungsdatum, false)
      : Date.now(),
    amount: parseFloat(paymentAmount.replace(",", ".")) || 0,
    description: verwendungszweck || counterparty,
    counterparty,
    bankReferenceId: transactionId
      ? `finom:${transactionId}`
      : createBankReferenceId("finom", [buchungsdatum, paymentAmount, counterparty]),
    accountName: walletName,
    currency: paymentCurrency,
  };
}

export function mapCSVRow(
  row: Record<string, string>,
  source: ImportSource,
): TransactionData {
  if (source === "moss") return mapMoss(row);
  if (source === "finom") return mapFinom(row);
  return mapGermanBank(row, source);
}
