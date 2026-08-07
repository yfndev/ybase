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
} from "../../db/types";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import {
  assertRequiredDocumentConfiguration,
  assignRequiredDocuments,
} from "./documentAssignments";

setupTestDatabase();

let organizationId: string;
let userId: string;
let membership: Membership;

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

  await assignRequiredDocuments(membership);

  const executions = await (await documentExecutions())
    .find({ membershipId: membership._id })
    .toArray();
  expect(executions).toHaveLength(4);
  expect(executions.map((item) => item.executionType)).toEqual(
    expect.arrayContaining([
      "signature",
      "acknowledgement",
      "optional_consent",
    ]),
  );
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

  await assignRequiredDocuments(membership);

  const assigned = await (await documentExecutions())
    .find({ membershipId: membership._id })
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

  await assignRequiredDocuments(membership);

  expect(
    await (
      await documentExecutions()
    ).countDocuments({
      membershipId: membership._id,
    }),
  ).toBe(3);
});

test("blocks admission when the member's department lacks its special agreement", async () => {
  await expect(assertRequiredDocumentConfiguration(membership)).rejects.toThrow(
    "Sondervereinbarung",
  );
});

test("does not require a special agreement without a department", async () => {
  await (await users()).updateOne({ _id: userId }, { $unset: { teamId: "" } });

  await expect(
    assertRequiredDocumentConfiguration(membership),
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
