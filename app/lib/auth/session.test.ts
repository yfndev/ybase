import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findOne: vi.fn(),
}));

vi.mock("./index", () => ({ auth: mocks.auth }));
vi.mock("../db/collections", () => ({
  users: vi.fn(async () => ({ findOne: mocks.findOne })),
}));

import { requirePermission, requireRole } from "./session";

beforeEach(() => {
  mocks.auth.mockResolvedValue({ user: { id: "user-id" } });
  mocks.findOne.mockReset();
});

test("People & Culture only passes its own elevated role guard", async () => {
  mocks.findOne.mockResolvedValue({
    _id: "user-id",
    organizationId: "organization-id",
    role: "people_culture",
  });

  await expect(requireRole("people_culture")).resolves.toMatchObject({
    role: "people_culture",
  });
  await expect(requireRole("finance")).rejects.toThrow(
    "Insufficient permissions",
  );
  await expect(requireRole("admin")).rejects.toThrow(
    "Insufficient permissions",
  );
  await expect(requirePermission("manage_roles")).rejects.toThrow(
    "Insufficient permissions",
  );
  await expect(
    requirePermission("manage_organization_settings"),
  ).rejects.toThrow("Insufficient permissions");
});

test("admin passes People & Culture and finance permission guards", async () => {
  mocks.findOne.mockResolvedValue({
    _id: "user-id",
    organizationId: "organization-id",
    role: "admin",
  });

  await expect(requirePermission("manage_recruiting")).resolves.toBeDefined();
  await expect(requirePermission("manage_finance")).resolves.toBeDefined();
});

test("invalid persisted roles safely receive member access", async () => {
  mocks.findOne.mockResolvedValue({
    _id: "user-id",
    organizationId: "organization-id",
    role: "invalid",
  });

  await expect(requireRole("member")).resolves.toMatchObject({
    role: "member",
  });
  await expect(requirePermission("manage_members")).rejects.toThrow(
    "Insufficient permissions",
  );
});
