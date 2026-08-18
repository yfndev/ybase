import { expect, test } from "vitest";
import { berlinMidnight } from "../members/legalDates";
import {
  APPLICATION_ADMISSION_ERRORS,
  getApplicationAdmissionIssue,
} from "./admissionEligibility";

const decidedAt = berlinMidnight({ year: 2026, month: 7, day: 31 });

test("requires a member-platform snapshot", () => {
  expect(getApplicationAdmissionIssue({}, decidedAt)).toBe(
    APPLICATION_ADMISSION_ERRORS.PROFILE_REQUIRED,
  );
});

test.each(["2011-08-01", "2001-07-31"])(
  "rejects an ineligible birth date %s",
  (dateOfBirth) => {
    expect(
      getApplicationAdmissionIssue(
        { dateOfBirth, memberPlatformUserId: "platform-1" },
        decidedAt,
      ),
    ).toBe(APPLICATION_ADMISSION_ERRORS.AGE_REQUIRED);
  },
);

test.each(["2009-01-01", "2004-01-01"])(
  "accepts an eligible birth date %s",
  (dateOfBirth) => {
    expect(
      getApplicationAdmissionIssue(
        { dateOfBirth, memberPlatformUserId: "platform-1" },
        decidedAt,
      ),
    ).toBeUndefined();
  },
);
