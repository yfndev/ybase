import { mapGermanBank } from "./germanBank";

export function mapVolksbank(row: Record<string, string>) {
  return mapGermanBank(row, "volksbank");
}
