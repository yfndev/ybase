import { mapGermanBank } from "./germanBank";

export function mapSparkasse(row: Record<string, string>) {
  return mapGermanBank(row, "sparkasse");
}
