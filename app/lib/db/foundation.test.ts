import { expect, test } from "vitest";
import { ensureAppUser, isLinkedWorkspaceUser } from "../auth/provisioning";
import { YFN_ORGANIZATION } from "../organization";
import { setupTestDatabase } from "../test/setupTestDatabase";
import { getDb } from "./client";
import {
  applications,
  jobPostings,
  logs,
  organizations,
  projects,
  users,
} from "./collections";
import { newId } from "./ids";
import type { Application } from "./types";

setupTestDatabase();

test("ensureAppUser creates a user and auto-joins an existing org by domain", async () => {
  const organizationId = newId();
  await (
    await organizations()
  ).insertOne({
    _id: organizationId,
    _creationTime: Date.now(),
    name: "YFN",
    domain: "youngfounders.network",
    createdBy: "seed",
  });

  const user = await ensureAppUser({
    email: "alice@youngfounders.network",
    name: "Alice",
  });

  expect(user.organizationId).toBe(organizationId);
  expect(user.role).toBe("member");
});

test("ensureAppUser bootstraps the static YFN organization", async () => {
  const user = await ensureAppUser({ email: "alice@youngfounders.network" });

  expect(user.role).toBe("admin");
  expect(user.memberStatus).toBe("active");
  expect(user.teamOnboardingStatus).toBe("completed");
  expect(user.organizationId).toEqual(expect.any(String));
  expect(user.publicProfileSetupRequired).toBe(true);
  expect(typeof user.registeredAt).toBe("number");

  await expect(
    (await organizations()).findOne({ _id: user.organizationId }),
  ).resolves.toMatchObject(YFN_ORGANIZATION);
  await expect(
    (await projects()).findOne({ organizationId: user.organizationId }),
  ).resolves.toMatchObject({ name: "Allgemein", isArchived: false });
});

test("ensureAppUser is idempotent for the same email", async () => {
  const first = await ensureAppUser({ email: "alice@youngfounders.network" });
  const second = await ensureAppUser({ email: "alice@youngfounders.network" });

  expect(second._id).toBe(first._id);
  const db = await getDb();
  expect(await db.collection("users").countDocuments()).toBe(1);
});

test("ensureAppUser links and follows a stable Google Workspace user ID", async () => {
  const first = await ensureAppUser({
    email: "alice@youngfounders.network",
    googleWorkspaceUserId: "google-user-1",
  });
  const second = await ensureAppUser({
    email: "alice.renamed@youngfounders.network",
    googleWorkspaceUserId: "google-user-1",
  });

  expect(second).toMatchObject({
    _id: first._id,
    email: "alice.renamed@youngfounders.network",
    googleWorkspaceUserId: "google-user-1",
  });
  await expect(isLinkedWorkspaceUser("google-user-1")).resolves.toBe(true);
  expect(await (await getDb()).collection("users").countDocuments()).toBe(1);
});

test("ensureAppUser rejects a Google Workspace account conflict", async () => {
  await ensureAppUser({
    email: "alice@youngfounders.network",
    googleWorkspaceUserId: "google-user-1",
  });

  await expect(
    ensureAppUser({
      email: "alice@youngfounders.network",
      googleWorkspaceUserId: "google-user-2",
    }),
  ).rejects.toThrow("another Google Workspace account");
});

test("ensureAppUser updates an existing user from the current login profile", async () => {
  const first = await ensureAppUser({
    email: "alice@youngfounders.network",
    name: "Outdated Name",
  });
  const second = await ensureAppUser({
    email: "alice@youngfounders.network",
    name: "Alice Example",
    firstName: "Alice",
    lastName: "Example",
  });

  expect(second).toMatchObject({
    _id: first._id,
    name: "Alice Example",
    firstName: "Alice",
    lastName: "Example",
  });
});

test("ensureAppUser does not provision a non-YFN account", async () => {
  const user = await ensureAppUser({ email: "bob@newverein.de", name: "Bob" });

  expect(user.organizationId).toBeUndefined();
  expect(user.role).toBeUndefined();
});

test("ensureAppUser moves a legacy account into YFN without carrying over admin access", async () => {
  const organizationId = newId();
  await (
    await organizations()
  ).insertOne({
    _id: organizationId,
    _creationTime: Date.now(),
    name: YFN_ORGANIZATION.name,
    domain: YFN_ORGANIZATION.domain,
    createdBy: "seed",
  });
  await (
    await users()
  ).insertOne({
    _id: newId(),
    _creationTime: Date.now(),
    email: "legacy@youngfounders.network",
    organizationId: "legacy-organization",
    role: "admin",
    memberStatus: "active",
    teamOnboardingStatus: "completed",
  });

  const user = await ensureAppUser({
    email: "legacy@youngfounders.network",
  });

  expect(user.organizationId).toBe(organizationId);
  expect(user.role).toBe("member");
});

test("links an accepted application on the first matching login", async () => {
  const organizationId = newId();
  const teamId = newId();
  const postingId = newId();
  const applicationId = newId();
  await (
    await organizations()
  ).insertOne({
    _id: organizationId,
    _creationTime: Date.now(),
    name: "YFN",
    domain: "youngfounders.network",
    createdBy: "seed",
  });
  await (
    await jobPostings()
  ).insertOne({
    _id: postingId,
    _creationTime: Date.now(),
    organizationId,
    teamId,
    status: "published",
    title: "People Lead",
    createdBy: "seed",
  });
  await insertAcceptedApplication({
    _id: applicationId,
    organizationId,
    jobPostingId: postingId,
  });

  const user = await ensureAppUser({
    email: "alex@youngfounders.network",
    name: "Alex",
  });

  expect(user).toMatchObject({
    applicationId,
    organizationId,
    teamId,
    memberStatus: "onboarding",
    teamOnboardingStatus: "not_started",
  });
  expect(
    await (await applications()).findOne({ _id: applicationId }),
  ).toMatchObject({
    onboardingUserId: user._id,
    cleanupEligibleAt: expect.any(Number),
  });
  expect(
    await (await logs()).findOne({ entityId: applicationId }),
  ).toMatchObject({ action: "application.onboarding_linked" });
});

test("does not auto-resolve ambiguous application matches", async () => {
  const organizationId = newId();
  const postingId = newId();
  await (
    await organizations()
  ).insertOne({
    _id: organizationId,
    _creationTime: Date.now(),
    name: "YFN",
    domain: "youngfounders.network",
    createdBy: "seed",
  });
  await (
    await jobPostings()
  ).insertOne({
    _id: postingId,
    _creationTime: Date.now(),
    organizationId,
    teamId: newId(),
    status: "published",
    title: "People Lead",
    createdBy: "seed",
  });
  await insertAcceptedApplication({ organizationId, jobPostingId: postingId });
  await insertAcceptedApplication({ organizationId, jobPostingId: postingId });

  const user = await ensureAppUser({
    email: "alex@youngfounders.network",
  });

  expect(user.applicationId).toBeUndefined();
  expect(
    await (
      await applications()
    ).countDocuments({
      onboardingLinkError: { $exists: true },
    }),
  ).toBe(2);
});

async function insertAcceptedApplication(
  overrides: Pick<Application, "organizationId" | "jobPostingId"> &
    Partial<Application>,
): Promise<void> {
  await (
    await applications()
  ).insertOne({
    _id: newId(),
    _creationTime: Date.now(),
    status: "accepted",
    applicantEmail: "private@example.com",
    applicantEmailNormalized: `private-${newId()}@example.com`,
    fields: [],
    files: [],
    tallyEventId: newId(),
    tallySubmissionId: newId(),
    tallyResponseId: newId(),
    tallyFormId: "form-1",
    yfnEmail: "alex@youngfounders.network",
    yfnEmailNormalized: "alex@youngfounders.network",
    submittedAt: Date.now(),
    ...overrides,
  });
}
