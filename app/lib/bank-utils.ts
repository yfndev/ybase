export const IBAN_REGEX = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/;
export const BIC_REGEX = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

export function formatIban(iban: string): string {
  return iban.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
}

export function normalizeIban(iban: string): string {
  return iban.replace(/\s/g, "").toUpperCase();
}

type BankDetails = {
  iban: string;
  bic?: string;
  accountHolder: string;
};

export function getBankDetailsError(details: BankDetails): string | null {
  if (!details.accountHolder.trim()) return "Bitte Kontoinhaber eingeben";
  const iban = normalizeIban(details.iban);
  if (!iban) return "Bitte IBAN eingeben";
  if (!IBAN_REGEX.test(iban)) return "Ungültige IBAN";

  const bic = details.bic?.replace(/\s/g, "").toUpperCase() ?? "";
  if (bic && !BIC_REGEX.test(bic)) return "Ungültige BIC";

  return null;
}

export function toNet(gross: number, taxRate: number): number {
  return gross / (1 + taxRate / 100);
}

export const CURRENCIES = ["EUR", "USD", "CHF", "GBP"] as const;

export const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€",
  USD: "$",
  CHF: "CHF",
  GBP: "£",
};
