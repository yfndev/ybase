import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({
  requireAuthenticatedUser: vi.fn(),
}));

import { requireAuthenticatedUser } from "../../auth/session";
import { reimbursementInvites, users } from "../../db/collections";
import { newId } from "../../db/ids";
import { createTestActor, insertTestOrganization } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { isValidReimbursementInvite } from "./data";
import { redeemReimbursementInvite } from "./redemption";
import { createReimbursementInviteToken } from "./token";

setupTestDatabase();

let organizationId: string;

beforeEach(async () => {
  vi.clearAllMocks();
  organizationId = newId();
  await insertTestOrganization({
    _id: organizationId,
    name: "Young Founders",
    domain: "youngfounders.network",
  });
});

async function insertInvite(): Promise<string> {
  const { token, tokenHash } = createReimbursementInviteToken();
  await (
    await reimbursementInvites()
  ).insertOne({
    _id: newId(),
    _creationTime: Date.now(),
    organizationId,
    tokenHash,
  });
  return token;
}

function onboardingMember(email: string) {
  return createTestActor({
    _id: newId(),
    email,
    organizationId,
    role: "member",
    memberStatus: "onboarding",
    teamOnboardingStatus: "not_started",
  });
}

test("redeems a prepared link as a normal active member", async () => {
  const token = await insertInvite();
  const member = onboardingMember("member@youngfounders.network");
  await (await users()).insertOne(member);
  vi.mocked(requireAuthenticatedUser).mockResolvedValue(member);

  await redeemReimbursementInvite(token);

  const updated = await (await users()).findOne({ _id: member._id });
  expect(updated).toMatchObject({
    memberStatus: "active",
    teamOnboardingStatus: "completed",
    role: "member",
  });
  expect(updated?.onboardedAt).toBeTypeOf("number");
});

test("the same link activates multiple members", async () => {
  const token = await insertInvite();
  const first = onboardingMember("first@youngfounders.network");
  const second = onboardingMember("second@youngfounders.network");
  await (await users()).insertMany([first, second]);

  vi.mocked(requireAuthenticatedUser).mockResolvedValue(first);
  await redeemReimbursementInvite(token);
  vi.mocked(requireAuthenticatedUser).mockResolvedValue(second);
  await redeemReimbursementInvite(token);

  expect(await (await users()).countDocuments({ memberStatus: "active" })).toBe(
    2,
  );
});

test("already active members can follow the link", async () => {
  const token = await insertInvite();
  vi.mocked(requireAuthenticatedUser).mockResolvedValue(
    createTestActor({
      email: "active@youngfounders.network",
      organizationId,
      role: "member",
      memberStatus: "active",
    }),
  );

  await expect(redeemReimbursementInvite(token)).resolves.toBeUndefined();
});

test("rejects accounts outside the organization domain", async () => {
  const token = await insertInvite();
  vi.mocked(requireAuthenticatedUser).mockResolvedValue(
    onboardingMember("member@example.org"),
  );

  await expect(redeemReimbursementInvite(token)).rejects.toThrow(
    "@youngfounders.network-Konto",
  );
});

test("rejects unknown tokens", async () => {
  const { token } = createReimbursementInviteToken();
  vi.mocked(requireAuthenticatedUser).mockResolvedValue(
    onboardingMember("member@youngfounders.network"),
  );

  await expect(isValidReimbursementInvite(token)).resolves.toBe(false);
  await expect(redeemReimbursementInvite(token)).rejects.toThrow("ungültig");
});
