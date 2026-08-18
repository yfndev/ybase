import { beforeEach, expect, test, vi } from "vitest";

vi.mock("@/lib/server/jobPostings/tallyTemplates", () => ({
  getRecruitingTallyTemplates: vi.fn(),
}));

import { getRecruitingTallyTemplates } from "@/lib/server/jobPostings/tallyTemplates";
import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
});

test("returns the available Tally templates", async () => {
  vi.mocked(getRecruitingTallyTemplates).mockResolvedValue([
    { id: "template-1", name: "Vorlage Allgemein" },
  ]);

  const response = await GET();

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    data: [{ id: "template-1", name: "Vorlage Allgemein" }],
  });
});

test("returns a safe error when Tally is unavailable", async () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.mocked(getRecruitingTallyTemplates).mockRejectedValue(
    new Error("Tally API details"),
  );

  const response = await GET();

  expect(response.status).toBe(503);
  await expect(response.json()).resolves.toEqual({
    error: "Tally-Vorlagen konnten nicht geladen werden",
  });
});
