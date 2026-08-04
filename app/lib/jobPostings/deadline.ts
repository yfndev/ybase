const BERLIN_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Berlin",
});

export const JOB_POSTING_DEADLINE_ERROR =
  "Die Frist muss in der Zukunft liegen";

export function berlinToday(now: Date = new Date()): string {
  return BERLIN_DATE.format(now);
}

export function berlinTomorrow(now: Date = new Date()): string {
  const [year, month, day] = berlinToday(now).split("-").map(Number);
  const tomorrow = new Date(Date.UTC(year, month - 1, day + 1));
  return tomorrow.toISOString().slice(0, 10);
}

export function isDeadlineInFuture(
  deadline: string | undefined,
  today: string = berlinToday(),
): boolean {
  if (!deadline) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return false;
  const [year, month, day] = deadline.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isCalendarDate = date.toISOString().slice(0, 10) === deadline;
  return isCalendarDate && deadline > today;
}

export function isDeadlinePassed(
  deadline: string | undefined,
  today: string = berlinToday(),
): boolean {
  if (!deadline) return false;
  return deadline < today;
}
