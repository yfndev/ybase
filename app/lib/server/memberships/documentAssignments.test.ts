import { beforeEach, expect, test } from "vitest";
import {
  documentExecutions,
  documentVersions,
  teams,
  users,
} from "../../db/collections";
import { newId } from "../../db/ids";
import type {
  DocumentExecutionType,
  Membership,
  MembershipDocumentKind,
  User,
} from "../../db/types";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import {
  assertOnboardingDocumentConfiguration,
  assignMembershipDocuments,
  assignOnboardingDocuments,
} from "./documentAssignments";

setupTestDatabase();

let organizationId: string;
let userId: string;
let membership: Membership;

async function loadUser(): Promise<User> {
  const user = await (await users()).findOne({ _id: userId });
  if (!user) throw new Error("test user missing");
  return user;
}

beforeEach(async () => {
  organizationId = newId();
  userId = newId();
  const departmentId = newId();
  const teamId = newId();
  membership = {
    _id: newId(),
    _creationTime: Date.now(),
    organizationId,
    userId,
    applicationId: newId(),
    membershipNumber: `YFN-2026-${newId()}`,
    isCurrent: true,
    legalStatus: "active",
    admittedAt: Date.now(),
    privateEmail: "member@example.org",
    firstName: "Ada",
    lastName: "Beispiel",
    dateOfBirth: "2004-01-01",
    address: {
      street: "Test 1",
      postalCode: "10115",
      city: "Berlin",
      country: "DE",
    },
    updatedAt: Date.now(),
  };
  await (
    await teams()
  ).insertOne({
    _id: teamId,
    _creationTime: Date.now(),
    name: "Tech",
    departmentId,
    organizationId,
    isArchived: false,
    createdBy: userId,
  });
  await (
    await users()
  ).insertOne({
    _id: userId,
    _creationTime: Date.now(),
    organizationId,
    teamId,
    memberStatus: "onboarding",
    teamOnboardingStatus: "completed",
  });
  await seedVersion("bylaws", "acknowledgement");
  await seedVersion("privacy_notice", "acknowledgement");
});

test("assigns usage rights through the team's department", async () => {
  const team = await (await teams()).findOne({ organizationId });
  await seedVersion("usage_rights", "signature", {
    targetDepartmentIds: [team?.departmentId ?? ""],
  });
  await seedVersion("optional_consent", "optional_consent");

  await assignOnboardingDocuments(await loadUser());

  const executions = await (await documentExecutions())
    .find({ userId })
    .toArray();
  expect(executions).toHaveLength(3);
  expect(executions.every((item) => item.membershipId === undefined)).toBe(
    true,
  );
  expect(executions.map((item) => item.executionType)).toEqual(
    expect.arrayContaining([
      "signature",
      "acknowledgement",
      "optional_consent",
    ]),
  );
});

test("assigns the bylaws only with the membership package", async () => {
  const team = await (await teams()).findOne({ organizationId });
  await seedVersion("usage_rights", "signature", {
    targetDepartmentIds: [team?.departmentId ?? ""],
  });
  await assignOnboardingDocuments(await loadUser());
  const bylaws = await (await documentVersions()).findOne({ kind: "bylaws" });

  expect(
    await (
      await documentExecutions()
    ).countDocuments({ documentVersionId: bylaws?._id }),
  ).toBe(0);

  await assignMembershipDocuments(membership);

  expect(
    await (
      await documentExecutions()
    ).countDocuments({
      documentVersionId: bylaws?._id,
      membershipId: membership._id,
    }),
  ).toBe(1);
});

test("assigns one special agreement per department the member works in", async () => {
  const team = await (await teams()).findOne({ organizationId });
  const secondDepartmentId = newId();
  const secondTeamId = newId();
  await (
    await teams()
  ).insertOne({
    _id: secondTeamId,
    _creationTime: Date.now(),
    name: "Marketing",
    departmentId: secondDepartmentId,
    organizationId,
    isArchived: false,
    createdBy: userId,
  });
  await (
    await users()
  ).updateOne({ _id: userId }, { $set: { secondaryTeamId: secondTeamId } });
  await seedVersion("usage_rights", "signature", {
    targetDepartmentIds: [team?.departmentId ?? ""],
  });
  await seedVersion("usage_rights", "signature", {
    targetDepartmentIds: [secondDepartmentId],
  });

  await assignOnboardingDocuments(await loadUser());

  const assigned = await (await documentExecutions())
    .find({ userId })
    .toArray();
  const usageRightsVersions = await (await documentVersions())
    .find({ kind: "usage_rights" })
    .toArray();
  const assignedUsageRights = assigned.filter((execution) =>
    usageRightsVersions.some(
      (version) => version._id === execution.documentVersionId,
    ),
  );
  expect(assignedUsageRights).toHaveLength(2);
});

test("keeps only the newest special agreement per department", async () => {
  const team = await (await teams()).findOne({ organizationId });
  await seedVersion("usage_rights", "signature", {
    targetDepartmentIds: [team?.departmentId ?? ""],
  });
  await seedVersion("usage_rights", "signature", {
    targetDepartmentIds: [team?.departmentId ?? ""],
  });

  await assignOnboardingDocuments(await loadUser());

  expect(await (await documentExecutions()).countDocuments({ userId })).toBe(2);
});

test("blocks onboarding when the member's department lacks its special agreement", async () => {
  await expect(
    assertOnboardingDocumentConfiguration(await loadUser()),
  ).rejects.toThrow("Sondervereinbarung");
});

test("does not require a special agreement without a department", async () => {
  await (await users()).updateOne({ _id: userId }, { $unset: { teamId: "" } });

  await expect(
    assertOnboardingDocumentConfiguration(await loadUser()),
  ).resolves.toBeUndefined();
});

async function seedVersion(
  kind: MembershipDocumentKind,
  executionType: DocumentExecutionType,
  targets: {
    targetTeamIds?: string[];
    targetDepartmentIds?: string[];
  } = {},
) {
  const id = newId();
  await (
    await documentVersions()
  ).insertOne({
    _id: id,
    _creationTime: Date.now(),
    organizationId,
    kind,
    title: kind,
    versionLabel: "2026-01",
    contentStorageKey: `test/${id}/content.html`,
    sha256: id.padEnd(64, "0").slice(0, 64),
    publishedAt: Date.now(),
    publishedBy: userId,
    targetTeamIds: targets.targetTeamIds ?? [],
    targetDepartmentIds: targets.targetDepartmentIds ?? [],
    executionType,
    isActive: true,
  });
}
