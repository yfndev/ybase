export type DateParts = { year: number; month: number; day: number };

export function addDays(parts: DateParts, days: number): DateParts {
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

export function isBerlinBusinessDay(parts: DateParts): boolean {
  const weekday = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day),
  ).getUTCDay();
  return weekday !== 0 && weekday !== 6 && !isBerlinPublicHoliday(parts);
}
