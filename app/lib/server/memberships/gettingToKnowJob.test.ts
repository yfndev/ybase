import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../users/email", () => ({ sendGettingToKnowDueEmail: vi.fn() }));

import { users } from "../../db/collections";
import { newId } from "../../db/ids";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { sendGettingToKnowDueEmail } from "../users/email";
import { processGettingToKnowPhases } from "./gettingToKnowJob";

setupTestDatabase();

const DAY = 24 * 60 * 60 * 1_000;

let organizationId: string;
let teamId: string;
let memberId: string;

async function insertMember(endsIn: number): Promise<string> {
  const _id = newId();
  await (
    await users()
  ).insertOne({
    _id,
    _creationTime: Date.now(),
    organizationId,
    teamId,
    name: "Alex Example",
    role: "member",
    memberStatus: "getting_to_know",
    gettingToKnow: { startedAt: Date.now(), endsAt: Date.now() + endsIn },
    teamOnboardingStatus: "completed",
  });
  return _id;
}

beforeEach(async () => {
  vi.clearAllMocks();
  organizationId = newId();
  teamId = newId();
  memberId = newId();
  await (
    await users()
  ).insertOne({
    _id: memberId,
    _creationTime: Date.now(),
    organizationId,
    teamId,
    isTeamLead: true,
    name: "Lead Example",
    privateEmail: "lead@example.org",
    role: "member",
    memberStatus: "active",
    teamOnboardingStatus: "completed",
  });
});

test("reminds the team lead once when the decision comes up", async () => {
  await insertMember(3 * DAY);

  await expect(processGettingToKnowPhases()).resolves.toMatchObject({
    remindersSent: 1,
  });
  await expect(processGettingToKnowPhases()).resolves.toMatchObject({
    remindersSent: 0,
  });
  expect(vi.mocked(sendGettingToKnowDueEmail)).toHaveBeenCalledTimes(1);
});

test("notifies the people and culture lead of the same organization", async () => {
  await (
    await users()
  ).insertOne({
    _id: newId(),
    _creationTime: Date.now(),
    organizationId,
    name: "People Culture Lead",
    privateEmail: "people@example.org",
    role: "people_culture",
    memberStatus: "active",
    teamOnboardingStatus: "completed",
  });
  await (
    await users()
  ).insertOne({
    _id: newId(),
    _creationTime: Date.now(),
    organizationId: newId(),
    name: "Other Org Lead",
    privateEmail: "other@example.org",
    role: "people_culture",
    memberStatus: "active",
    teamOnboardingStatus: "completed",
  });
  await insertMember(3 * DAY);

  await processGettingToKnowPhases();

  const recipientNames = vi
    .mocked(sendGettingToKnowDueEmail)
    .mock.calls.map(([input]) => input.recipient.name);
  expect(recipientNames).toHaveLength(2);
  expect(recipientNames).toContain("Lead Example");
  expect(recipientNames).toContain("People Culture Lead");
});

test("keeps quiet while the phase is still running", async () => {
  await insertMember(20 * DAY);

  await expect(processGettingToKnowPhases()).resolves.toMatchObject({
    remindersSent: 0,
  });
  expect(vi.mocked(sendGettingToKnowDueEmail)).not.toHaveBeenCalled();
});

test("never ends the phase on its own", async () => {
  const overdueId = await insertMember(-5 * DAY);

  await processGettingToKnowPhases();

  expect(await (await users()).findOne({ _id: overdueId })).toMatchObject({
    memberStatus: "getting_to_know",
  });
});
