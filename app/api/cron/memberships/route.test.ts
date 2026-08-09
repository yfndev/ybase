import { afterEach, expect, test, vi } from "vitest";

vi.mock("@/lib/server/memberships/dailyJob", () => ({
  processDailyMemberships: vi.fn(),
}));
vi.mock("@/lib/server/memberships/gettingToKnowJob", () => ({
  processGettingToKnowPhases: vi.fn(),
}));

import { processDailyMemberships } from "@/lib/server/memberships/dailyJob";
import { processGettingToKnowPhases } from "@/lib/server/memberships/gettingToKnowJob";
import { POST } from "./route";

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

test("rejects membership jobs without the cron secret", async () => {
  vi.stubEnv("CRON_SECRET", "secret");
  const response = await POST(
    new Request("https://example.org/api/cron/memberships", {
      method: "POST",
    }),
  );

  expect(response.status).toBe(401);
  expect(processDailyMemberships).not.toHaveBeenCalled();
});

test("runs the daily membership job with the cron secret", async () => {
  vi.stubEnv("CRON_SECRET", "secret");
  vi.mocked(processDailyMemberships).mockResolvedValue({
    ageOutsScheduled: 1,
    membershipsEnded: 0,
    accessRetries: 0,
    failures: 0,
  });
  vi.mocked(processGettingToKnowPhases).mockResolvedValue({
    remindersSent: 2,
    failures: 0,
  });
  const response = await POST(
    new Request("https://example.org/api/cron/memberships", {
      method: "POST",
      headers: { authorization: "Bearer secret" },
    }),
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    data: {
      ageOutsScheduled: 1,
      membershipsEnded: 0,
      accessRetries: 0,
      remindersSent: 2,
      failures: 0,
    },
  });
});
