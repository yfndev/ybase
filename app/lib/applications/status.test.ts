import { describe, expect, test } from "vitest";
import { getApplicationDisplayStatus } from "./status";

describe("getApplicationDisplayStatus", () => {
  test("keeps regular application statuses unchanged", () => {
    expect(getApplicationDisplayStatus({ status: "review" })).toBe("review");
  });

  test("shows the progress of accepted applications", () => {
    expect(getApplicationDisplayStatus({ status: "accepted" })).toBe(
      "accepted",
    );
    expect(
      getApplicationDisplayStatus({
        status: "accepted",
        onboardingUserId: "user-1",
      }),
    ).toBe("ybase_registered");
    expect(
      getApplicationDisplayStatus({
        status: "accepted",
        onboardingUserId: "user-1",
        onboardingStartedAt: 21,
      }),
    ).toBe("onboarding_active");
    expect(
      getApplicationDisplayStatus({
        status: "accepted",
        onboardingUserId: "user-1",
        onboardingStartedAt: 21,
        onboardingCompletedAt: 42,
      }),
    ).toBe("onboarding_completed");
  });
});
