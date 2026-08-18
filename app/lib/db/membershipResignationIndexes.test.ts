import { beforeAll, expect, test } from "vitest";
import { setupTestDatabase } from "../test/setupTestDatabase";
import { membershipResignationRequests } from "./collections";
import { ensureIndexes } from "./indexes";

setupTestDatabase();

beforeAll(async () => {
  await ensureIndexes();
});

test("prevents guardian confirmation token reuse across memberships", async () => {
  const collection = await membershipResignationRequests();
  const request = {
    _creationTime: Date.now(),
    organizationId: "organization-1",
    status: "pending_guardian" as const,
    declarationText: "Declaration",
    declarationVersion: 1,
    requestedAt: Date.now(),
    guardianTokenHash: "shared-token-hash",
  };
  await collection.insertOne({
    ...request,
    _id: "membership-1",
    membershipId: "membership-1",
    userId: "user-1",
  });

  await expect(
    collection.insertOne({
      ...request,
      _id: "membership-2",
      membershipId: "membership-2",
      userId: "user-2",
    }),
  ).rejects.toMatchObject({ code: 11_000 });
});
