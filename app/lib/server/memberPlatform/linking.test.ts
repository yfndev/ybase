import { afterAll, beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({
  requireAuthenticatedUser: vi.fn(),
}));

import { requireAuthenticatedUser } from "../../auth/session";
import { getClient } from "../../db/client";
import { users } from "../../db/collections";
import { newId } from "../../db/ids";
import type { User } from "../../db/types";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { confirmMemberPlatformProfile } from "./actions";
import { getMemberPlatformLinkingData } from "./linking";

const PLATFORM_DATABASE = "member_platform_linking_test";
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
  vi.mocked(requireAuthenticatedUser).mockReset();
});

test("suggests one profile and excludes profiles already linked in YBase", async () => {
  const member = await insertMember({
    name: "Zoë Beispiel",
    privateEmail: "zoe@example.com",
  });
  await insertPlatformProfile("platform-1", "Zoë", "Beispiel");
  await insertPlatformProfile("platform-2", "Andere", "Person");
  await insertMember({ memberPlatformUserId: "platform-2" });

  const data = await getMemberPlatformLinkingData(member);

  expect(data).toEqual({
    suggestedId: "platform-1",
    profiles: [
      {
        id: "platform-1",
        name: "Zoë Beispiel",
        imageUrl: "https://example.com/profile.jpg",
      },
    ],
  });
});

test("links exactly the profile confirmed by the member", async () => {
  const member = await insertMember();
  vi.mocked(requireAuthenticatedUser).mockResolvedValue(member);
  await insertPlatformProfile("platform-1", "Andere", "Person");

  await confirmMemberPlatformProfile("platform-1");

  await expect(
    (await users()).findOne({ _id: member._id }),
  ).resolves.toMatchObject({
    memberPlatformUserId: "platform-1",
    privateEmail: "private@example.com",
    phone: "+49 170 1234567",
    memberPlatformSyncedAt: expect.any(Number),
  });
});

test("rejects a profile that another YBase member has already claimed", async () => {
  const member = await insertMember();
  vi.mocked(requireAuthenticatedUser).mockResolvedValue(member);
  await insertPlatformProfile("platform-1", "Andere", "Person");
  await insertMember({ memberPlatformUserId: "platform-1" });

  await expect(confirmMemberPlatformProfile("platform-1")).rejects.toThrow(
    "bereits verknüpft",
  );
});

test("does not expose or link profiles for accounts outside YFN", async () => {
  const member = await insertMember({ email: "zoe@example.com" });
  vi.mocked(requireAuthenticatedUser).mockResolvedValue(member);
  await insertPlatformProfile("platform-1", "Zoë", "Beispiel");

  await expect(getMemberPlatformLinkingData(member)).resolves.toBeNull();
  await expect(confirmMemberPlatformProfile("platform-1")).rejects.toThrow(
    "nicht verfügbar",
  );
});

async function insertMember(overrides: Partial<User> = {}): Promise<User> {
  const member: User = {
    _id: newId(),
    _creationTime: Date.now(),
    name: "Zoë Beispiel",
    email: "zoe@youngfounders.network",
    memberStatus: "onboarding",
    teamOnboardingStatus: "not_started",
    ...overrides,
  };
  await (await users()).insertOne(member);
  return member;
}

async function insertPlatformProfile(
  id: string,
  firstName: string,
  lastName: string,
): Promise<void> {
  const database = (await getClient()).db(PLATFORM_DATABASE);
  await Promise.all([
    database.collection("users").insertOne({
      id,
      deletedAt: null,
      person: { firstName, lastName },
      contact: {
        email: "private@example.com",
        phone: "+49 170 1234567",
      },
      images: { profileImage: "https://example.com/profile.jpg" },
    }),
    database.collection("user-states").insertOne({
      userId: id,
      current: "ACCEPTED",
    }),
  ]);
}
