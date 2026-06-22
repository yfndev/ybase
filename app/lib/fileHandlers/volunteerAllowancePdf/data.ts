import { rgb } from "pdf-lib";

export const BLUE = rgb(0.118, 0.251, 0.686);
export const LIGHT_GRAY = rgb(0.96, 0.96, 0.96);
export const TEXT_DARK = rgb(0.13, 0.13, 0.13);
export const TEXT_MUTED = rgb(0.45, 0.45, 0.45);
export const WHITE = rgb(1, 1, 1);

export const M = 40;

export type VolunteerAllowanceData = {
  id?: string;
  amount: number;
  iban: string;
  bic?: string;
  accountHolder: string;
  activityDescription: string;
  startDate: string;
  endDate: string;
  taxYear?: string;
  volunteerName: string;
  volunteerStreet: string;
  volunteerPlz: string;
  volunteerCity: string;
  projectName: string;
  organizationName: string;
  organizationStreet?: string;
  organizationPlz?: string;
  organizationCity?: string;
  status?: string;
  reviewedByName?: string;
  reviewedAt?: number;
};

export function splitText(value: string, maxChars: number): string[] {
  const words = value.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length <= maxChars) {
      current = test;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  return lines;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("de-DE");
}
