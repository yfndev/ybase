import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({ requireAuthenticatedUser: vi.fn() }));

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
import { activateMembershipOnboardingIfComplete } from "./onboardingCompletion";
import {
  confirmOwnMembershipProfile,
  getOwnMembershipOnboardingContext,
} from "./onboardingData";

setupTestDatabase();

let actor: User & { organizationId: string };
let application: Application;

beforeEach(async () => {
  vi.clearAllMocks();
  const now = Date.now();
  const organizationId = newId();
  const teamId = newId();
  const userId = newId();
  const applicationId = newId();
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
      departmentId: newId(),
      name: "Operations",
      isArchived: false,
      createdBy: userId,
    }),
  ]);
  await Promise.all([
    seedVersion("bylaws", "acknowledgement"),
    seedVersion("code_of_conduct", "signature"),
    seedVersion("privacy_notice", "acknowledgement"),
  ]);
  vi.mocked(requireAuthenticatedUser).mockResolvedValue(actor);
});

test("creates the accepted member's legal record and exposes YBase document tasks", async () => {
  const first = await getOwnMembershipOnboardingContext();
  const second = await getOwnMembershipOnboardingContext();

  expect(first.profile).toMatchObject({
    firstName: "Alex",
    lastName: "Beispiel",
    dateOfBirth: "2004-01-01",
    confirmed: false,
  });
  expect(first.documents).toHaveLength(3);
  expect(second.documents).toHaveLength(3);
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
    ).countDocuments({
      membershipId: membership?._id,
    }),
  ).toBe(3);
  expect(await (await users()).findOne({ _id: actor._id })).toMatchObject({
    membershipId: membership?._id,
    memberStatus: "onboarding",
  });
});

test("activates access after profile confirmation and all documents without a P&C gate", async () => {
  const context = await getOwnMembershipOnboardingContext();
  await confirmOwnMembershipProfile({
    privateEmail: "alex.private@example.org",
    phone: "+49 30 654321",
    street: "Beispielstraße 12",
    postalCode: "10115",
    city: "Berlin",
    country: "Deutschland",
    profileDataConfirmed: true,
    supportsAssociationPurposes: true,
  });
  expect(await (await users()).findOne({ _id: actor._id })).toMatchObject({
    memberStatus: "onboarding",
    teamOnboardingStatus: "in_progress",
  });

  await (
    await documentExecutions()
  ).updateMany(
    { _id: { $in: context.documents.map(({ executionId }) => executionId) } },
    { $set: { status: "completed", completedAt: Date.now() } },
  );
  const membership = await (
    await memberships()
  ).findOne({ applicationId: application._id });
  expect(membership).not.toBeNull();
  expect(
    await activateMembershipOnboardingIfComplete(membership?._id ?? ""),
  ).toBe(true);

  expect(await (await users()).findOne({ _id: actor._id })).toMatchObject({
    memberStatus: "active",
    teamOnboardingStatus: "in_progress",
    privateEmail: "alex.private@example.org",
  });
  expect(
    await (await applications()).findOne({ _id: application._id }),
  ).toMatchObject({
    onboardingCompletedAt: expect.any(Number),
    onboardingCompletedBy: actor._id,
  });
});

async function seedVersion(
  kind: MembershipDocumentKind,
  executionType: DocumentExecutionType,
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
    sourceUrl: "https://docs.google.com/example",
    snapshotStorageKey: `test/${id}.pdf`,
    sha256: id.padEnd(64, "0").slice(0, 64),
    publishedAt: Date.now(),
    publishedBy: actor._id,
    targetTeamIds: [],
    targetDepartmentIds: [],
    executionType,
    isActive: true,
  });
}
