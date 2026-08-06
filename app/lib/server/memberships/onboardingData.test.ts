import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({ requireAuthenticatedUser: vi.fn() }));
vi.mock("./documentContent", () => ({ loadDocumentContent: vi.fn() }));

import { requireAuthenticatedUser } from "../../auth/session";
import {
  applications,
  documentExecutions,
  documentVersions,
  memberships,
  teams,
  users,
} from "../../db/collections";
import { newId } from "../../db/ids";
import type {
  Application,
  DocumentExecutionType,
  MembershipDocumentKind,
  User,
} from "../../db/types";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { loadDocumentContent } from "./documentContent";
import { getOwnMembershipOnboardingContext } from "./onboardingData";

setupTestDatabase();

let actor: User & { organizationId: string };
let application: Application;
let departmentId: string;

beforeEach(async () => {
  vi.clearAllMocks();
  const now = Date.now();
  const organizationId = newId();
  const teamId = newId();
  const userId = newId();
  const applicationId = newId();
  departmentId = newId();
  actor = {
    _id: userId,
    _creationTime: now,
    organizationId,
    applicationId,
    memberPlatformUserId: "member-platform-profile",
    name: "Alex Beispiel",
    email: "alex@youngfounders.network",
    privateEmail: "alex@example.org",
    teamId,
    role: "member",
    memberStatus: "onboarding",
    teamOnboardingStatus: "in_progress",
  };
  application = {
    _id: applicationId,
    _creationTime: now,
    organizationId,
    jobPostingId: newId(),
    status: "accepted",
    applicantName: "Alex Beispiel",
    applicantEmail: "alex@example.org",
    applicantEmailNormalized: "alex@example.org",
    applicantPhone: "+49 30 123456",
    dateOfBirth: "2004-01-01",
    memberPlatformUserId: actor.memberPlatformUserId,
    fields: [],
    files: [],
    tallyEventId: newId(),
    tallySubmissionId: newId(),
    tallyResponseId: newId(),
    tallyFormId: "form-1",
    submittedAt: now,
    onboardingStartedAt: now,
  };
  await Promise.all([
    (await users()).insertOne(actor),
    (await applications()).insertOne(application),
    (await teams()).insertOne({
      _id: teamId,
      _creationTime: now,
      organizationId,
      departmentId,
      name: "Operations",
      isArchived: false,
      createdBy: userId,
    }),
  ]);
  await Promise.all([
    seedVersion("code_of_conduct", "signature"),
    seedVersion("bylaws", "acknowledgement"),
    seedVersion("privacy_notice", "acknowledgement"),
    seedVersion("usage_rights", "signature", [departmentId]),
  ]);
  vi.mocked(requireAuthenticatedUser).mockResolvedValue(actor);
  vi.mocked(loadDocumentContent).mockResolvedValue("<p>Dokumententext</p>");
});

test("creates the legal record and returns the documents in reading order", async () => {
  const first = await getOwnMembershipOnboardingContext();
  const second = await getOwnMembershipOnboardingContext();

  expect(first.profile).toMatchObject({
    firstName: "Alex",
    lastName: "Beispiel",
    dateOfBirth: "2004-01-01",
    confirmed: false,
  });
  expect(first.documents.map(({ kind }) => kind)).toEqual([
    "privacy_notice",
    "usage_rights",
    "bylaws",
    "code_of_conduct",
  ]);
  expect(first.documentsComplete).toBe(false);
  expect(second.documents).toHaveLength(4);

  const membership = await (
    await memberships()
  ).findOne({ applicationId: application._id });
  expect(membership).toMatchObject({
    userId: actor._id,
    legalStatus: "active",
    memberPlatformUserId: actor.memberPlatformUserId,
  });
  expect(
    await (
      await documentExecutions()
    ).countDocuments({ membershipId: membership?._id }),
  ).toBe(4);
});

test("delivers the frozen text inline for open documents only", async () => {
  const context = await getOwnMembershipOnboardingContext();
  await (
    await documentExecutions()
  ).updateOne(
    { _id: context.documents[0].executionId },
    { $set: { status: "completed", completedAt: Date.now() } },
  );

  const updated = await getOwnMembershipOnboardingContext();

  expect(updated.documents[0]).toMatchObject({
    status: "completed",
    content: "",
  });
  expect(updated.documents[1].content).toBe("<p>Dokumententext</p>");
  expect(updated.documentsComplete).toBe(false);
});

async function seedVersion(
  kind: MembershipDocumentKind,
  executionType: DocumentExecutionType,
  targetDepartmentIds: string[] = [],
) {
  const id = newId();
  await (
    await documentVersions()
  ).insertOne({
    _id: id,
    _creationTime: Date.now(),
    organizationId: actor.organizationId,
    kind,
    title: kind,
    versionLabel: "2026-01",
    contentStorageKey: `test/${id}/content.html`,
    sha256: id.padEnd(64, "0").slice(0, 64),
    publishedAt: Date.now(),
    publishedBy: actor._id,
    targetTeamIds: [],
    targetDepartmentIds,
    executionType,
    isActive: true,
  });
}
