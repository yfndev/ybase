import { expect, test } from "vitest";
import {
  berlinToday,
  berlinTomorrow,
  isDeadlineInFuture,
  isDeadlinePassed,
} from "./deadline";

test("berlinToday formats as YYYY-MM-DD in Europe/Berlin", () => {
  expect(berlinToday(new Date("2026-07-14T10:00:00Z"))).toBe("2026-07-14");
});

test("berlinToday rolls into the next day using the Berlin offset", () => {
  // 23:30 UTC in July is already 01:30 the next day in Berlin (CEST, +2).
  expect(berlinToday(new Date("2026-07-14T23:30:00Z"))).toBe("2026-07-15");
});

test("berlinTomorrow returns the next Berlin calendar day", () => {
  expect(berlinTomorrow(new Date("2026-03-28T23:30:00Z"))).toBe("2026-03-30");
  expect(berlinTomorrow(new Date("2026-10-24T23:30:00Z"))).toBe("2026-10-26");
});

test("isDeadlineInFuture accepts empty and future deadlines", () => {
  expect(isDeadlineInFuture(undefined, "2026-07-14")).toBe(true);
  expect(isDeadlineInFuture("", "2026-07-14")).toBe(true);
  expect(isDeadlineInFuture("2026-07-15", "2026-07-14")).toBe(true);
  expect(isDeadlineInFuture("2026-07-14", "2026-07-14")).toBe(false);
  expect(isDeadlineInFuture("2026-07-13", "2026-07-14")).toBe(false);
  expect(isDeadlineInFuture("2026-02-30", "2026-01-01")).toBe(false);
  expect(isDeadlineInFuture("keine-frist", "2026-07-14")).toBe(false);
});

test("isDeadlinePassed is false without a deadline", () => {
  expect(isDeadlinePassed(undefined, "2026-07-14")).toBe(false);
  expect(isDeadlinePassed("", "2026-07-14")).toBe(false);
});

test("isDeadlinePassed only once the deadline day is over", () => {
  expect(isDeadlinePassed("2026-07-13", "2026-07-14")).toBe(true);
  expect(isDeadlinePassed("2026-07-14", "2026-07-14")).toBe(false);
  expect(isDeadlinePassed("2026-07-15", "2026-07-14")).toBe(false);
});
