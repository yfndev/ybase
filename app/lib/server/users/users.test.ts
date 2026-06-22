import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({
  requireUser: vi.fn(),
  requireRole: vi.fn(),
}));

import { requireRole, requireUser } from "../../auth/session";
import { getClient, getDb } from "../../db/client";
import { logs, organizations, users } from "../../db/collections";
import { newId } from "../../db/ids";
import {
  addUserToOrganization,
  updateBankDetails,
  updateUserRole,
} from "./actions";
import { listOrganizationUsers } from "./data";

let mongod: MongoMemoryServer;
let orgA: string;
let orgB: string;
let adminA: string;
let memberA: string;
let memberB: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.MONGODB_DB = "ybase_test";
}, 120_000);

afterAll(async () => {
  const client = await getClient();
  await client.close();
  await mongod.stop();
}, 30_000);

beforeEach(async () => {
  await (await getDb()).dropDatabase();
  orgA = newId();
  orgB = newId();
  adminA = newId();
  memberA = newId();
  memberB = newId();
  await (await organizations()).insertMany([
    { _id: orgA, _creationTime: Date.now(), name: "A", domain: "a.org", createdBy: adminA },
    { _id: orgB, _creationTime: Date.now(), name: "B", domain: "b.org", createdBy: memberB },
  ]);
  await (await users()).insertMany([
    {
      _id: adminA,
      _creationTime: Date.now(),
      name: "Admin A",
      email: "admin@a.org",
      organizationId: orgA,
      role: "admin",
    },
    {
      _id: memberA,
      _creationTime: Date.now(),
      name: "Member A",
      email: "member@a.org",
      organizationId: orgA,
      role: "member",
    },
    {
      _id: memberB,
      _creationTime: Date.now(),
      name: "Member B",
      email: "member@b.org",
      organizationId: orgB,
      role: "member",
    },
  ]);
  const actor = {
    _id: adminA,
    _creationTime: Date.now(),
    organizationId: orgA,
    role: "admin" as const,
  };
  vi.mocked(requireUser).mockResolvedValue(actor);
  vi.mocked(requireRole).mockResolvedValue(actor);
});

test("listOrganizationUsers only returns users from the caller's org", async () => {
  const list = await listOrganizationUsers();
  expect(list.map((u) => u.name).sort()).toEqual(["Admin A", "Member A"]);
});

test("updateUserRole promotes a member and writes a log", async () => {
  await updateUserRole({ userId: memberA, role: "lead" });
  const updated = await (await users()).findOne({ _id: memberA });
  expect(updated?.role).toBe("lead");
  const log = await (await logs()).findOne({ action: "user.role_change" });
  expect(log?.entityId).toBe(memberA);
});

test("updateUserRole cannot touch a user from another org", async () => {
  await expect(updateUserRole({ userId: memberB, role: "lead" })).rejects.toThrow(
    "Access denied",
  );
});

test("updateUserRole blocks demoting the last admin", async () => {
  await expect(updateUserRole({ userId: adminA, role: "member" })).rejects.toThrow(
    "Der letzte Admin kann nicht entfernt werden. Mindestens ein Admin ist erforderlich.",
  );
});

test("addUserToOrganization cannot pull in a user from another org", async () => {
  await expect(
    addUserToOrganization({ userId: memberB, organizationId: orgA }),
  ).rejects.toThrow("User not found");
  const unchanged = await (await users()).findOne({ _id: memberB });
  expect(unchanged?.organizationId).toBe(orgB);
});

test("updateBankDetails updates the caller's own bank details", async () => {
  await updateBankDetails({
    iban: "DE89",
    bic: "ABCDEF",
    accountHolder: "Admin A",
  });
  const updated = await (await users()).findOne({ _id: adminA });
  expect(updated?.iban).toBe("DE89");
  expect(updated?.bic).toBe("ABCDEF");
  expect(updated?.accountHolder).toBe("Admin A");
});
