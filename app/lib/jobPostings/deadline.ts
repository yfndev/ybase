const BERLIN_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Berlin",
});

export function berlinToday(now: Date = new Date()): string {
  return BERLIN_DATE.format(now);
}

export function isDeadlinePassed(
  deadline: string | undefined,
  today: string = berlinToday(),
): boolean {
  if (!deadline) return false;
  return deadline < today;
}
