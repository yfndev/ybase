import { afterAll, beforeEach, expect, test } from "vitest";
import { getClient } from "../../db/client";
import { users } from "../../db/collections";
import { newId } from "../../db/ids";
import type { User } from "../../db/types";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { tryRefreshMemberPlatformProfile } from "./sync";

const PLATFORM_DATABASE = "member_platform_test";
const previousPlatformDatabase = process.env.MEMBER_PLATFORM_MONGODB_DB;

setupTestDatabase();

afterAll(() => {
  if (previousPlatformDatabase === undefined) {
    delete process.env.MEMBER_PLATFORM_MONGODB_DB;
    return;
  }
  process.env.MEMBER_PLATFORM_MONGODB_DB = previousPlatformDatabase;
});

beforeEach(async () => {
  process.env.MEMBER_PLATFORM_MONGODB_DB = PLATFORM_DATABASE;
  await (await getClient()).db(PLATFORM_DATABASE).dropDatabase();
});

test("refreshes contact details for an existing confirmed link", async () => {
  const member = await insertMember({
    email: "zoe@youngfounders.network",
    privateEmail: "old@example.com",
    memberPlatformUserId: "platform-1",
  });
  await insertPlatformProfile({
    id: "platform-1",
    email: "zoe@example.com",
    phone: "+49 170 1234567",
  });

  const synced = await tryRefreshMemberPlatformProfile(member);

  expect(synced).toMatchObject({
    memberPlatformUserId: "platform-1",
    privateEmail: "zoe@example.com",
    phone: "+49 170 1234567",
    memberPlatformSyncedAt: expect.any(Number),
  });
  await expect(
    (await users()).findOne({ _id: member._id }),
  ).resolves.toMatchObject({
    memberPlatformUserId: "platform-1",
    phone: "+49 170 1234567",
  });
});

test("does not link an unconfirmed profile automatically", async () => {
  const member = await insertMember({
    email: "new@youngfounders.network",
    privateEmail: "shared@example.com",
  });
  await insertPlatformProfile({
    id: "platform-1",
    email: "shared@example.com",
  });

  const synced = await tryRefreshMemberPlatformProfile(member);

  expect(synced.memberPlatformUserId).toBeUndefined();
  expect(await (await users()).findOne({ _id: member._id })).not.toHaveProperty(
    "memberPlatformUserId",
  );
});

test("does not refresh linked accounts outside the YFN domain", async () => {
  const member = await insertMember({
    email: "zoe@example.org",
    privateEmail: "old@example.com",
    memberPlatformUserId: "platform-1",
  });
  await insertPlatformProfile({
    id: "platform-1",
    email: "zoe@example.com",
  });

  const synced = await tryRefreshMemberPlatformProfile(member);

  expect(synced.privateEmail).toBe("old@example.com");
});

async function insertMember(overrides: Partial<User>): Promise<User> {
  const member: User = {
    _id: newId(),
    _creationTime: Date.now(),
    name: "Zoë Beispiel",
    memberStatus: "active",
    teamOnboardingStatus: "completed",
    ...overrides,
  };
  await (await users()).insertOne(member);
  return member;
}

async function insertPlatformProfile(input: {
  id: string;
  email: string;
  phone?: string;
}): Promise<void> {
  const database = (await getClient()).db(PLATFORM_DATABASE);
  await Promise.all([
    database.collection("users").insertOne({
      id: input.id,
      deletedAt: null,
      person: { firstName: "Zoë", lastName: "Beispiel" },
      contact: { email: input.email, phone: input.phone },
    }),
    database.collection("user-states").insertOne({
      userId: input.id,
      current: "ACCEPTED",
    }),
  ]);
}
