export const IBAN_REGEX = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/;
export const BIC_REGEX = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

export function formatIban(iban: string): string {
  return iban.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
}

export function normalizeIban(iban: string): string {
  return iban.replace(/\s/g, "").toUpperCase();
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
