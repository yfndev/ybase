import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({ requirePermission: vi.fn() }));
vi.mock("../../googleWorkspace/membershipLifecycle", () => ({
  suspendWorkspaceUser: vi.fn(),
}));
vi.mock("../users/email", () => ({ sendUserStateEmail: vi.fn() }));

import { requirePermission } from "../../auth/session";
import { logs, memberships, users } from "../../db/collections";
import { newId } from "../../db/ids";
import { suspendWorkspaceUser } from "../../googleWorkspace/membershipLifecycle";
import { createTestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { sendUserStateEmail } from "../users/email";
import { confirmGettingToKnow, endGettingToKnow } from "./gettingToKnow";

setupTestDatabase();

let organizationId: string;
let memberId: string;

beforeEach(async () => {
  vi.clearAllMocks();
  organizationId = newId();
  memberId = newId();
  vi.mocked(requirePermission).mockResolvedValue(
    createTestActor({ organizationId }),
  );
  await (
    await users()
  ).insertOne({
    _id: memberId,
    _creationTime: Date.now(),
    organizationId,
    name: "Alex Example",
    email: "alex@youngfounders.network",
    googleWorkspaceUserId: "workspace-id",
    teamId: newId(),
    isTeamLead: true,
    role: "member",
    memberStatus: "getting_to_know",
    gettingToKnow: { startedAt: Date.now(), endsAt: Date.now() + 1_000 },
    teamOnboardingStatus: "completed",
  });
});

test("confirming the phase opens the membership onboarding", async () => {
  await confirmGettingToKnow({ userId: memberId });

  const member = await (await users()).findOne({ _id: memberId });
  expect(member).toMatchObject({ memberStatus: "getting_to_know" });
  expect(member?.gettingToKnow).toMatchObject({
    outcome: "confirmed",
    decidedAt: expect.any(Number),
    decidedBy: expect.any(String),
  });
  expect(await (await memberships()).countDocuments({})).toBe(0);
  expect(vi.mocked(sendUserStateEmail)).toHaveBeenCalledWith(
    expect.objectContaining({ event: "membership_invitation" }),
  );
});

test("ending the phase archives the account without a membership", async () => {
  await endGettingToKnow({ userId: memberId, outcome: "ended_by_org" });

  const member = await (await users()).findOne({ _id: memberId });
  expect(member).toMatchObject({
    memberStatus: "archived",
    archivedAt: expect.any(Number),
  });
  expect(member?.gettingToKnow?.outcome).toBe("ended_by_org");
  expect(member).not.toHaveProperty("teamId");
  expect(member).not.toHaveProperty("isTeamLead");
  expect(await (await memberships()).countDocuments({})).toBe(0);
  expect(vi.mocked(suspendWorkspaceUser)).toHaveBeenCalledWith("workspace-id");
  expect(await (await logs()).distinct("action", {})).toEqual([
    "member.getting_to_know_ended",
  ]);
});

test("a resignation in the phase ends it immediately as well", async () => {
  await endGettingToKnow({ userId: memberId, outcome: "ended_by_member" });

  expect(await (await users()).findOne({ _id: memberId })).toMatchObject({
    memberStatus: "archived",
    gettingToKnow: expect.objectContaining({ outcome: "ended_by_member" }),
  });
});

test("ends a confirmed phase that never reached the membership form", async () => {
  await confirmGettingToKnow({ userId: memberId });

  await endGettingToKnow({ userId: memberId, outcome: "ended_by_org" });

  expect(await (await users()).findOne({ _id: memberId })).toMatchObject({
    memberStatus: "archived",
  });
  await expect(confirmGettingToKnow({ userId: memberId })).rejects.toThrow(
    "nicht in der Kennenlernphase",
  );
});

test("cannot confirm twice", async () => {
  await confirmGettingToKnow({ userId: memberId });

  await expect(confirmGettingToKnow({ userId: memberId })).rejects.toThrow(
    "bereits bestätigt",
  );
});

test("only members inside the phase can be decided on", async () => {
  await (
    await users()
  ).updateOne({ _id: memberId }, { $set: { memberStatus: "active" } });

  await expect(confirmGettingToKnow({ userId: memberId })).rejects.toThrow(
    "nicht in der Kennenlernphase",
  );
  await expect(
    endGettingToKnow({ userId: memberId, outcome: "ended_by_org" }),
  ).rejects.toThrow("nicht in der Kennenlernphase");
});

test("cannot decide across organizations", async () => {
  vi.mocked(requirePermission).mockResolvedValue(
    createTestActor({ organizationId: newId() }),
  );

  await expect(confirmGettingToKnow({ userId: memberId })).rejects.toThrow(
    "User not found",
  );
});
