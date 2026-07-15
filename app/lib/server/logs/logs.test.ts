import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({
  requireUser: vi.fn(),
  requireRole: vi.fn(),
}));

import { requireRole, requireUser } from "../../auth/session";
import { logs, organizations } from "../../db/collections";
import { newId } from "../../db/ids";
import { createTestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { getLogs } from "./data";

let orgA: string;
let orgB: string;
let userA: string;

setupTestDatabase();

beforeEach(async () => {
  orgA = newId();
  orgB = newId();
  userA = newId();
  await (
    await organizations()
  ).insertMany([
    {
      _id: orgA,
      _creationTime: Date.now(),
      name: "A",
      domain: "a.org",
      createdBy: userA,
    },
    {
      _id: orgB,
      _creationTime: Date.now(),
      name: "B",
      domain: "b.org",
      createdBy: newId(),
    },
  ]);
  const actor = createTestActor({
    _id: userA,
    organizationId: orgA,
  });
  vi.mocked(requireUser).mockResolvedValue(actor);
  vi.mocked(requireRole).mockResolvedValue(actor);
});

test("getLogs returns only the caller's org logs, newest-first", async () => {
  await (
    await logs()
  ).insertMany([
    {
      _id: newId(),
      _creationTime: 1000,
      organizationId: orgA,
      userId: userA,
      action: "older",
      entityId: newId(),
    },
    {
      _id: newId(),
      _creationTime: 3000,
      organizationId: orgA,
      userId: userA,
      action: "newer",
      entityId: newId(),
    },
    {
      _id: newId(),
      _creationTime: 5000,
      organizationId: orgB,
      userId: newId(),
      action: "foreign",
      entityId: newId(),
    },
  ]);

  const list = await getLogs();
  expect(list.map((log) => log.action)).toEqual(["newer", "older"]);
});
