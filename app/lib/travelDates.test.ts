import { describe, expect, test } from "vitest";
import {
  getTravelDateRangeError,
  TRAVEL_DATE_RANGE_ERROR,
} from "./travelDates";

describe("getTravelDateRangeError", () => {
  test("accepts same-day and chronological ranges", () => {
    expect(getTravelDateRangeError("2026-05-15", "2026-05-15")).toBeNull();
    expect(getTravelDateRangeError("2026-05-15", "2026-05-20")).toBeNull();
  });

  test("rejects an end date before the start date", () => {
    expect(getTravelDateRangeError("2026-05-15", "2025-05-20")).toBe(
      TRAVEL_DATE_RANGE_ERROR,
    );
  });

  test("rejects an end time before the start time on the same day", () => {
    expect(
      getTravelDateRangeError("2026-05-15", "2026-05-15", "18:00", "08:00"),
    ).toBe(TRAVEL_DATE_RANGE_ERROR);
    expect(
      getTravelDateRangeError("2026-05-15", "2026-05-16", "18:00", "08:00"),
    ).toBeNull();
  });
});
