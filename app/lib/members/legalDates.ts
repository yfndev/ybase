import { addDays, type DateParts, isBerlinBusinessDay } from "./berlinHolidays";

const BERLIN_TIME_ZONE = "Europe/Berlin";

function parseIsoDate(value: string): DateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error("Datum muss im Format JJJJ-MM-TT vorliegen.");
  const parts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
  const normalized = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  if (
    normalized.getUTCFullYear() !== parts.year ||
    normalized.getUTCMonth() !== parts.month - 1 ||
    normalized.getUTCDate() !== parts.day
  ) {
    throw new Error("Ungültiges Kalenderdatum.");
  }
  return parts;
}

function berlinParts(timestamp: number): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BERLIN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(timestamp);
  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day") };
}

export function berlinMidnight(parts: DateParts): number {
  const target = Date.UTC(parts.year, parts.month - 1, parts.day);
  let guess = target;
  for (let iteration = 0; iteration < 3; iteration += 1) {
    const rendered = new Intl.DateTimeFormat("en-CA", {
      timeZone: BERLIN_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    }).formatToParts(guess);
    const part = (type: string) =>
      Number(rendered.find((item) => item.type === type)?.value);
    const represented = Date.UTC(
      part("year"),
      part("month") - 1,
      part("day"),
      part("hour"),
    );
    guess += target - represented;
  }
  return guess;
}

export function ageOnDate(dateOfBirth: string, timestamp: number): number {
  const birth = parseIsoDate(dateOfBirth);
  const current = berlinParts(timestamp);
  let age = current.year - birth.year;
  if (
    current.month < birth.month ||
    (current.month === birth.month && current.day < birth.day)
  ) {
    age -= 1;
  }
  return age;
}

export function assertAdmissionAge(
  dateOfBirth: string,
  decidedAt: number,
): void {
  const age = ageOnDate(dateOfBirth, decidedAt);
  if (age < 16 || age >= 25) {
    throw new Error(
      "Bei der Aufnahmeentscheidung muss die Person mindestens 16 und noch nicht 25 Jahre alt sein.",
    );
  }
}

export function ageLimitAt(dateOfBirth: string): number {
  const birth = parseIsoDate(dateOfBirth);
  const targetYear = birth.year + 25;
  const normalized = new Date(Date.UTC(targetYear, birth.month - 1, birth.day));
  return berlinMidnight({
    year: normalized.getUTCFullYear(),
    month: normalized.getUTCMonth() + 1,
    day: normalized.getUTCDate(),
  });
}

export function resignationEndAt(receivedAt: number): number {
  const received = berlinParts(receivedAt);
  const inTime =
    received.month < 9 || (received.month === 9 && received.day <= 30);
  return berlinMidnight({
    year: received.year + (inTime ? 1 : 2),
    month: 1,
    day: 1,
  });
}

function addOneMonth(parts: DateParts): DateParts {
  const month = parts.month === 12 ? 1 : parts.month + 1;
  const year = parts.month === 12 ? parts.year + 1 : parts.year;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { year, month, day: Math.min(parts.day, lastDay) };
}

export function oneMonthAfter(timestamp: number): number {
  return berlinMidnight(addOneMonth(berlinParts(timestamp)));
}

export function oneMonthObjectionExpiresAt(deliveredAt: number): number {
  let deadline = addOneMonth(berlinParts(deliveredAt));
  while (!isBerlinBusinessDay(deadline)) {
    deadline = addDays(deadline, 1);
  }
  return berlinMidnight(addDays(deadline, 1));
}

export function calendarDaysUntil(
  targetTimestamp: number,
  fromTimestamp: number,
): number {
  const target = berlinParts(targetTimestamp);
  const from = berlinParts(fromTimestamp);
  const targetUtc = Date.UTC(target.year, target.month - 1, target.day);
  const fromUtc = Date.UTC(from.year, from.month - 1, from.day);
  return Math.round((targetUtc - fromUtc) / (24 * 60 * 60 * 1_000));
}
