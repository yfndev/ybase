import { describe, expect, test } from "vitest";
import { formatBerlinIsoDate, parseBerlinDate } from "./berlinDate";
import {
  ageLimitAt,
  ageOnDate,
  assertAdmissionAge,
  berlinMidnight,
  calendarDaysUntil,
  oneMonthObjectionExpiresAt,
  resignationEndAt,
} from "./legalDates";

describe("membership legal dates in Europe/Berlin", () => {
  test.each([
    ["2010-03-01", "2026-02-28", 15],
    ["2010-03-01", "2026-03-01", 16],
    ["2001-03-01", "2026-02-28", 24],
    ["2001-03-01", "2026-03-01", 25],
  ])("calculates age for %s on %s", (birth, date, expected) => {
    expect(ageOnDate(birth, berlinMidnight(iso(date)))).toBe(expected);
  });

  test("accepts only ages 16 through 24 at the decision", () => {
    const decision = berlinMidnight(iso("2026-03-01"));
    expect(() => assertAdmissionAge("2010-03-01", decision)).not.toThrow();
    expect(() => assertAdmissionAge("2011-03-01", decision)).toThrow();
    expect(() => assertAdmissionAge("2001-03-01", decision)).toThrow();
  });

  test("normalizes a leap-day age-out to March 1 in non-leap years", () => {
    expect(new Date(ageLimitAt("2004-02-29")).toISOString()).toBe(
      "2029-02-28T23:00:00.000Z",
    );
  });

  test.each([
    ["2026-09-30", "2026-12-31T23:00:00.000Z"],
    ["2026-10-01", "2027-12-31T23:00:00.000Z"],
  ])("computes resignation deadline from %s", (received, expected) => {
    expect(
      new Date(resignationEndAt(berlinMidnight(iso(received)))).toISOString(),
    ).toBe(expected);
  });

  test("parses and formats calendar dates in Europe/Berlin", () => {
    const timestamp = parseBerlinDate("2026-08-07");

    expect(new Date(timestamp).toISOString()).toBe("2026-08-06T22:00:00.000Z");
    expect(formatBerlinIsoDate(timestamp)).toBe("2026-08-07");
    expect(() => parseBerlinDate("2026-02-30")).toThrow(
      "Ungültiges Kalenderdatum",
    );
  });

  test("moves a one-month deadline from a weekend to the next business day", () => {
    const delivered = berlinMidnight(iso("2026-01-31"));
    expect(new Date(oneMonthObjectionExpiresAt(delivered)).toISOString()).toBe(
      "2026-03-02T23:00:00.000Z",
    );
  });

  test("moves a one-month deadline from a Berlin holiday", () => {
    const delivered = berlinMidnight(iso("2026-03-06"));
    expect(new Date(oneMonthObjectionExpiresAt(delivered)).toISOString()).toBe(
      "2026-04-07T22:00:00.000Z",
    );
  });

  test("counts calendar days across the daylight-saving change", () => {
    const from = berlinMidnight(iso("2026-03-20"));
    const target = berlinMidnight(iso("2026-04-19"));
    expect(calendarDaysUntil(target, from)).toBe(30);
  });
});

function iso(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}
