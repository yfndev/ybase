const BERLIN_TIME_ZONE = "Europe/Berlin";

type DateParts = { year: number; month: number; day: number };

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

function addDays(parts: DateParts, days: number): DateParts {
  const date = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day + days),
  );
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function easterSunday(year: number): DateParts {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const value = h + l - 7 * m + 114;
  return {
    year,
    month: Math.floor(value / 31),
    day: (value % 31) + 1,
  };
}

function sameDate(left: DateParts, right: DateParts): boolean {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day
  );
}

function isBerlinPublicHoliday(parts: DateParts): boolean {
  const fixedHolidays = [
    { year: parts.year, month: 1, day: 1 },
    { year: parts.year, month: 3, day: 8 },
    { year: parts.year, month: 5, day: 1 },
    { year: parts.year, month: 10, day: 3 },
    { year: parts.year, month: 12, day: 25 },
    { year: parts.year, month: 12, day: 26 },
  ];
  const easter = easterSunday(parts.year);
  const movableHolidays = [
    addDays(easter, -2),
    addDays(easter, 1),
    addDays(easter, 39),
    addDays(easter, 50),
  ];
  return [...fixedHolidays, ...movableHolidays].some((holiday) =>
    sameDate(parts, holiday),
  );
}

function isBerlinBusinessDay(parts: DateParts): boolean {
  const weekday = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day),
  ).getUTCDay();
  return weekday !== 0 && weekday !== 6 && !isBerlinPublicHoliday(parts);
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

export function oneMonthObjectionExpiresAt(deliveredAt: number): number {
  const source = berlinParts(deliveredAt);
  const nextMonth = source.month === 12 ? 1 : source.month + 1;
  const nextYear = source.month === 12 ? source.year + 1 : source.year;
  const lastDay = new Date(Date.UTC(nextYear, nextMonth, 0)).getUTCDate();
  const lastValidDay = Math.min(source.day, lastDay);
  let deadline = { year: nextYear, month: nextMonth, day: lastValidDay };
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
