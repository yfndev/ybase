export const TRAVEL_DATE_RANGE_ERROR =
  "Das Reiseende muss am oder nach dem Reisebeginn liegen. Korrigiere das Datum, um die Kostenarten anzuzeigen.";

export function getTravelDateRangeError(
  startDate: string,
  endDate: string,
): string | null {
  if (!startDate || !endDate || endDate >= startDate) return null;
  return TRAVEL_DATE_RANGE_ERROR;
}
