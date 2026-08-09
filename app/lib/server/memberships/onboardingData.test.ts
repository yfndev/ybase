import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({ requireAuthenticatedUser: vi.fn() }));
vi.mock("./documentContent", () => ({ loadDocumentContent: vi.fn() }));
vi.mock("../applications/memberPlatformCandidates", () => ({
  loadApplicationMemberPlatformSnapshot: vi.fn(),
}));

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
import { oneMonthAfter } from "../../members/legalDates";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { loadApplicationMemberPlatformSnapshot } from "../applications/memberPlatformCandidates";
import { loadDocumentContent } from "./documentContent";
import {
  getOwnMembershipOnboardingContext,
  type MembershipOnboardingContext,
} from "./onboardingData";

async function loadContext(): Promise<MembershipOnboardingContext> {
  const context = await getOwnMembershipOnboardingContext();
  if ("blocked" in context) throw new Error(`blocked: ${context.blocked}`);
  return context;
}

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
    seedVersion("bylaws", "acknowledgement"),
    seedVersion("privacy_notice", "acknowledgement"),
    seedVersion("usage_rights", "signature", [departmentId]),
  ]);
  vi.mocked(requireAuthenticatedUser).mockResolvedValue(actor);
  vi.mocked(loadDocumentContent).mockResolvedValue("<p>Dokumententext</p>");
});

test("assigns the onboarding documents without creating a membership", async () => {
  const first = await loadContext();
  const second = await loadContext();

  expect(first.phase).toBe("documents");
  expect(first.profile).toBeUndefined();
  expect(first.documents.map(({ kind }) => kind)).toEqual([
    "privacy_notice",
    "usage_rights",
  ]);
  expect(first.documentsComplete).toBe(false);
  expect(second.documents).toHaveLength(2);

  expect(await (await memberships()).countDocuments({})).toBe(0);
  const executions = await (await documentExecutions())
    .find({ userId: actor._id })
    .toArray();
  expect(executions.every((item) => item.membershipId === undefined)).toBe(
    true,
  );
});

test("starts the getting-to-know phase once the documents are done", async () => {
  const context = await loadContext();
  await (
    await documentExecutions()
  ).updateMany(
    { userId: actor._id },
    { $set: { status: "completed", completedAt: Date.now() } },
  );
  expect(context.documents).toHaveLength(2);

  const completed = await loadContext();

  expect(completed.activated).toBe(true);
  const stored = await (await users()).findOne({ _id: actor._id });
  expect(stored).toMatchObject({ memberStatus: "getting_to_know" });
  expect(stored?.gettingToKnow?.endsAt).toBe(
    oneMonthAfter(stored?.gettingToKnow?.startedAt ?? 0),
  );
  expect(await (await memberships()).countDocuments({})).toBe(0);
});

test("creates the legal record with the bylaws after the getting-to-know phase", async () => {
  await enterMembershipPhase();

  const context = await loadContext();

  expect(context.phase).toBe("membership");
  expect(context.profile).toMatchObject({
    firstName: "Alex",
    lastName: "Beispiel",
    dateOfBirth: "2004-01-01",
    applicationSigned: false,
  });
  expect(context.documents.map(({ kind }) => kind)).toEqual(["bylaws"]);

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
  ).toBe(1);
});

test("creates the legal record for a manually added member without an application", async () => {
  await enterMembershipPhase();
  const manualActor = { ...actor, applicationId: undefined };
  delete manualActor.applicationId;
  await (
    await users()
  ).updateOne({ _id: actor._id }, { $unset: { applicationId: "" } });
  vi.mocked(requireAuthenticatedUser).mockResolvedValue(manualActor);
  vi.mocked(loadApplicationMemberPlatformSnapshot).mockResolvedValue({
    memberPlatformUserId: "member-platform-profile",
    memberPlatformSyncedAt: Date.now(),
    dateOfBirth: "2004-01-01",
  });

  const context = await loadContext();

  expect(context.documents).toHaveLength(1);
  const membership = await (await memberships()).findOne({ userId: actor._id });
  expect(membership).toMatchObject({
    memberPlatformUserId: actor.memberPlatformUserId,
  });
  expect(membership).not.toHaveProperty("applicationId");
  expect(membership).not.toHaveProperty("handoverTasks");
});

test("delivers the frozen text inline for open documents only", async () => {
  const context = await loadContext();
  await (
    await documentExecutions()
  ).updateOne(
    { _id: context.documents[0].executionId },
    { $set: { status: "completed", completedAt: Date.now() } },
  );

  const updated = await loadContext();

  expect(updated.documents[0]).toMatchObject({
    status: "completed",
    content: "",
  });
  expect(updated.documents[1].content).toBe("<p>Dokumententext</p>");
  expect(updated.documentsComplete).toBe(false);
});

async function enterMembershipPhase() {
  const confirmed = {
    startedAt: Date.now(),
    endsAt: Date.now(),
    decidedAt: Date.now(),
    outcome: "confirmed" as const,
  };
  await (
    await users()
  ).updateOne(
    { _id: actor._id },
    { $set: { memberStatus: "getting_to_know", gettingToKnow: confirmed } },
  );
  actor = {
    ...actor,
    memberStatus: "getting_to_know",
    gettingToKnow: confirmed,
  };
  vi.mocked(requireAuthenticatedUser).mockResolvedValue(actor);
}

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
