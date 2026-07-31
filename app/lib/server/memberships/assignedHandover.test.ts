import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({ requireUser: vi.fn() }));

import { requireUser } from "../../auth/session";
import { membershipEvents, memberships, users } from "../../db/collections";
import { newId } from "../../db/ids";
import type { Membership } from "../../db/types";
import { createTestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import {
  getOwnAssignedHandoverTasks,
  setAssignedHandoverTaskCompleted,
} from "./assignedHandover";

setupTestDatabase();

let actorId: string;
let membership: Membership;
let ownTaskId: string;
let otherTaskId: string;

beforeEach(async () => {
  actorId = newId();
  const organizationId = newId();
  const memberId = newId();
  ownTaskId = newId();
  otherTaskId = newId();
  const now = Date.now();
  membership = {
    _id: newId(),
    _creationTime: now,
    organizationId,
    userId: memberId,
    applicationId: newId(),
    membershipNumber: newId(),
    isCurrent: true,
    legalStatus: "resigning",
    admittedAt: now - 1,
    privateEmail: "member@example.org",
    firstName: "Alex",
    lastName: "Example",
    dateOfBirth: "2005-01-01",
    handoverStartedAt: now,
    handoverTasks: [
      {
        _id: ownTaskId,
        category: "files",
        title: "Dateien übergeben",
        ownerUserId: actorId,
      },
      {
        _id: otherTaskId,
        category: "successor",
        title: "Nachfolge klären",
        ownerUserId: newId(),
      },
    ],
    updatedAt: now,
  };
  await (await memberships()).insertOne(membership);
  await (
    await users()
  ).insertOne({
    _id: memberId,
    _creationTime: now,
    organizationId,
    membershipId: membership._id,
    name: "Alex Example",
    role: "member",
    memberStatus: "offboarding_planned",
    teamOnboardingStatus: "completed",
  });
  vi.mocked(requireUser).mockResolvedValue(
    createTestActor({ _id: actorId, organizationId }),
  );
});

test("lists only handover tasks assigned to the current user", async () => {
  await expect(getOwnAssignedHandoverTasks()).resolves.toEqual([
    expect.objectContaining({
      membershipId: membership._id,
      taskId: ownTaskId,
      memberName: "Alex Example",
    }),
  ]);
});

test("completes only an assigned task and records the event", async () => {
  await setAssignedHandoverTaskCompleted({
    membershipId: membership._id,
    taskId: ownTaskId,
    isCompleted: true,
  });

  const updated = await (await memberships()).findOne({ _id: membership._id });
  expect(updated?.handoverTasks[0]).toMatchObject({
    completedAt: expect.any(Number),
    completedBy: actorId,
  });
  expect(
    await (await membershipEvents()).findOne({ membershipId: membership._id }),
  ).toMatchObject({
    type: "handover.task_updated",
    actorUserId: actorId,
  });

  await expect(
    setAssignedHandoverTaskCompleted({
      membershipId: membership._id,
      taskId: otherTaskId,
      isCompleted: true,
    }),
  ).rejects.toThrow("nicht gefunden");
});
