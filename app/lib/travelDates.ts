export const TRAVEL_DATE_RANGE_ERROR =
  "Das Reiseende muss nach dem Reisebeginn liegen. Korrigiere Datum oder Uhrzeit, um die Kostenarten anzuzeigen.";

export function getTravelDateRangeError(
  startDate: string,
  endDate: string,
  startTime?: string,
  endTime?: string,
): string | null {
  if (!startDate || !endDate) return null;
  if (endDate < startDate) return TRAVEL_DATE_RANGE_ERROR;
  if (endDate === startDate && startTime && endTime && endTime < startTime) {
    return TRAVEL_DATE_RANGE_ERROR;
  }
  return null;
}
