import { beforeEach, expect, test, vi } from "vitest";
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
  vi.unstubAllEnvs();
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
    handoverTasks: [],
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
  vi.stubEnv("MEMBERSHIP_USAGE_RIGHTS_DEPARTMENT_IDS", departmentId);
  await seedVersion("bylaws", "acknowledgement");
  await seedVersion("code_of_conduct", "signature");
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
  expect(executions).toHaveLength(5);
  expect(executions.map((item) => item.executionType)).toEqual(
    expect.arrayContaining([
      "signature",
      "acknowledgement",
      "optional_consent",
    ]),
  );
});

test("blocks admission when a configured department lacks its contract", async () => {
  await expect(assertRequiredDocumentConfiguration(membership)).rejects.toThrow(
    "Nutzungsrechtevertrag",
  );
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
    sourceUrl: "https://docs.google.com/example",
    snapshotStorageKey: `test/${id}.pdf`,
    sha256: id.padEnd(64, "0").slice(0, 64),
    publishedAt: Date.now(),
    publishedBy: userId,
    targetTeamIds: targets.targetTeamIds ?? [],
    targetDepartmentIds: targets.targetDepartmentIds ?? [],
    executionType,
    isActive: true,
  });
}
