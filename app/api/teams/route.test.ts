import { beforeEach, expect, test, vi } from "vitest";

vi.mock("@/lib/server/teams/actions", () => ({
  createTeam: vi.fn(),
}));

vi.mock("@/lib/server/teams/data", () => ({
  getActiveTeams: vi.fn(),
  getArchivedTeams: vi.fn(),
}));

import { createTeam } from "@/lib/server/teams/actions";
import { POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
});

test("POST creates a team through a stable HTTP endpoint", async () => {
  vi.mocked(createTeam).mockResolvedValue("team-1");

  const response = await POST(
    new Request("http://localhost/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "People & Culture", departmentId: "ops" }),
    }),
  );

  expect(response.status).toBe(201);
  await expect(response.json()).resolves.toEqual({ data: "team-1" });
  expect(createTeam).toHaveBeenCalledWith({
    name: "People & Culture",
    departmentId: "ops",
  });
});

test("POST returns a safe error response when creation fails", async () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.mocked(createTeam).mockRejectedValue(new Error("database details"));

  const response = await POST(
    new Request("http://localhost/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "People & Culture", departmentId: "ops" }),
    }),
  );

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "Team konnte nicht erstellt werden",
  });
});
