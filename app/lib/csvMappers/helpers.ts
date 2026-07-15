import type { ImportSource } from "./types";

export function parseGermanDate(
  dateString: string,
  addCentury: boolean,
): number {
  const parts = dateString.split(".");
  if (parts.length !== 3) return Date.now();
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10) + (addCentury ? 2000 : 0);
  return new Date(year, month - 1, day).getTime();
}

export function parseGermanAmount(amount: string): number {
  return parseFloat(amount.replace(/\./g, "").replace(",", ".")) || 0;
}

export function createBankReferenceId(
  source: ImportSource,
  parts: string[],
): string {
  const filled = parts.filter(Boolean);
  if (filled.length > 0) {
    return `${source}:${filled.join(":")}`.replace(/[^a-zA-Z0-9:\-_.]/g, "_");
  }
  return `${source}:${Date.now()}-${Math.random()}`;
}
