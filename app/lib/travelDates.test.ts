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
});
