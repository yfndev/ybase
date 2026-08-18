import { berlinMidnight } from "./legalDates";

const BERLIN_TIME_ZONE = "Europe/Berlin";

export function parseBerlinDate(value: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error("Datum muss im Format JJJJ-MM-TT vorliegen.");
  const [year, month, day] = match.slice(1).map(Number);
  const normalized = new Date(Date.UTC(year, month - 1, day));
  if (
    normalized.getUTCFullYear() !== year ||
    normalized.getUTCMonth() !== month - 1 ||
    normalized.getUTCDate() !== day
  ) {
    throw new Error("Ungültiges Kalenderdatum.");
  }
  return berlinMidnight({ year, month, day });
}

export function formatBerlinIsoDate(timestamp: number): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BERLIN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(timestamp);
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}
