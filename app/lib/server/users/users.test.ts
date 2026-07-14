import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({
  requireUser: vi.fn(),
  requireRole: vi.fn(),
  requirePermission: vi.fn(),
}));

import {
  requirePermission,
  requireRole,
  requireUser,
} from "../../auth/session";
import { getClient, getDb } from "../../db/client";
import { logs, organizations, users } from "../../db/collections";
import { newId } from "../../db/ids";
import {
  addUserToOrganization,
  setMemberStatus,
  setTeamOnboardingStatus,
  updateBankDetails,
  updateMemberProfile,
  updateUserRole,
} from "./actions";
import { listMembers, listOrganizationUsers } from "./data";

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
  await (
    await organizations()
  ).insertMany([
    {
      _id: orgA,
      _creationTime: Date.now(),
      name: "A",
      domain: "a.org",
      createdBy: adminA,
    },
    {
      _id: orgB,
      _creationTime: Date.now(),
      name: "B",
      domain: "b.org",
      createdBy: memberB,
    },
  ]);
  await (
    await users()
  ).insertMany([
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
  vi.mocked(requirePermission).mockResolvedValue(actor);
});

test("listOrganizationUsers only returns users from the caller's org", async () => {
  const list = await listOrganizationUsers();
  expect(list.map((u) => u.name).sort()).toEqual(["Admin A", "Member A"]);
});

test("updateUserRole promotes a member to admin and writes a log", async () => {
  await updateUserRole({ userId: memberA, role: "admin" });
  const updated = await (await users()).findOne({ _id: memberA });
  expect(updated?.role).toBe("admin");
  const log = await (await logs()).findOne({ action: "user.role_change" });
  expect(log?.entityId).toBe(memberA);
});

test("updateUserRole grants finance access without admin access", async () => {
  await updateUserRole({ userId: memberA, role: "finance" });
  const updated = await (await users()).findOne({ _id: memberA });
  expect(updated?.role).toBe("finance");
});

test("updateUserRole supports the People & Culture role", async () => {
  await updateUserRole({ userId: memberA, role: "people_culture" });
  const updated = await (await users()).findOne({ _id: memberA });
  expect(updated?.role).toBe("people_culture");
});

test("updateUserRole cannot touch a user from another org", async () => {
  await expect(
    updateUserRole({ userId: memberB, role: "admin" }),
  ).rejects.toThrow("Access denied");
});

test("updateUserRole blocks demoting the last admin", async () => {
  await expect(
    updateUserRole({ userId: adminA, role: "member" }),
  ).rejects.toThrow(
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
    iban: "de89 3704 0044 0532 0130 00",
    bic: "cobadeffxxx",
    accountHolder: "Admin A",
  });
  const updated = await (await users()).findOne({ _id: adminA });
  expect(updated?.iban).toBe("DE89370400440532013000");
  expect(updated?.bic).toBe("COBADEFFXXX");
  expect(updated?.accountHolder).toBe("Admin A");
});

test("updateBankDetails rejects missing bank details", async () => {
  await expect(
    updateBankDetails({ iban: "", bic: "", accountHolder: "" }),
  ).rejects.toThrow();
});

test("setMemberStatus activates a member and stamps the onboarding time", async () => {
  await setMemberStatus({ userId: memberA, status: "active" });
  const updated = await (await users()).findOne({ _id: memberA });
  expect(updated?.memberStatus).toBe("active");
  expect(typeof updated?.onboardedAt).toBe("number");
  const log = await (await logs()).findOne({ action: "member.status_change" });
  expect(log?.entityId).toBe(memberA);
});

test("setMemberStatus offboards a member and stamps the offboarding time", async () => {
  await setMemberStatus({ userId: memberA, status: "offboarded" });
  const updated = await (await users()).findOne({ _id: memberA });
  expect(updated?.memberStatus).toBe("offboarded");
  expect(typeof updated?.offboardedAt).toBe("number");
});

test("setMemberStatus cannot touch a user from another org", async () => {
  await expect(
    setMemberStatus({ userId: memberB, status: "offboarded" }),
  ).rejects.toThrow("User not found");
});

test("setTeamOnboardingStatus completes team onboarding with a timestamp", async () => {
  await setTeamOnboardingStatus({ userId: memberA, status: "completed" });
  const updated = await (await users()).findOne({ _id: memberA });
  expect(updated?.teamOnboardingStatus).toBe("completed");
  expect(typeof updated?.teamOnboardedAt).toBe("number");
});

test("updateMemberProfile sets team and position title", async () => {
  await updateMemberProfile({
    userId: memberA,
    teamId: "team-1",
    positionTitle: "Treasurer",
  });
  const updated = await (await users()).findOne({ _id: memberA });
  expect(updated?.teamId).toBe("team-1");
  expect(updated?.positionTitle).toBe("Treasurer");
});

test("listMembers keeps offboarded profiles visible", async () => {
  await setMemberStatus({ userId: memberA, status: "offboarded" });
  const members = await listMembers();
  const offboarded = members.find((member) => member._id === memberA);
  expect(offboarded?.memberStatus).toBe("offboarded");
});
