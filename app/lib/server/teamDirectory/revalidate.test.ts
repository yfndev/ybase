import { afterEach, beforeEach, expect, test, vi } from "vitest";

vi.mock("next/server", () => ({
  after: vi.fn(),
}));

import { after } from "next/server";
import { scheduleTeamDirectoryRevalidation } from "./revalidate";

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test("schedules authenticated landing cache invalidation after the response", async () => {
  vi.stubEnv(
    "YFN_LANDING_REVALIDATE_URL",
    "https://youngfounders.network/api/revalidate/team-directory",
  );
  vi.stubEnv("YFN_LANDING_REVALIDATE_SECRET", "shared-secret");
  const fetchMock = vi.fn().mockResolvedValue(new Response(null));
  vi.stubGlobal("fetch", fetchMock);

  scheduleTeamDirectoryRevalidation();

  expect(after).toHaveBeenCalledOnce();
  const callback = vi.mocked(after).mock.calls[0]?.[0];
  expect(callback).toBeTypeOf("function");
  if (typeof callback !== "function") throw new Error("Callback not scheduled");
  await callback();
  expect(fetchMock).toHaveBeenCalledWith(
    "https://youngfounders.network/api/revalidate/team-directory",
    expect.objectContaining({
      method: "POST",
      headers: { Authorization: "Bearer shared-secret" },
      cache: "no-store",
    }),
  );
});

test("does not schedule invalidation without complete configuration", () => {
  scheduleTeamDirectoryRevalidation();
  expect(after).not.toHaveBeenCalled();
});
