import { afterEach, beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({ requirePermission: vi.fn() }));
vi.mock("./memberPlatformAtlasSearch", () => ({
  searchMemberPlatformProfilesWithAtlas: vi.fn(),
}));

import { requirePermission } from "../../auth/session";
import { getClient } from "../../db/client";
import { applications } from "../../db/collections";
import { newId } from "../../db/ids";
import type { Application } from "../../db/types";
import { createTestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { syncApplicationMemberPlatformProfile } from "./admissionRequirements";
import {
  searchApplicationMemberPlatformProfilesAction,
  selectApplicationMemberPlatformProfileAction,
} from "./admissionRequirementsAction";
import { searchMemberPlatformProfilesWithAtlas } from "./memberPlatformAtlasSearch";

const now = Date.parse("2026-07-31T10:00:00Z");
const PLATFORM_DATABASE = "application_admission_requirements_test";
let application: Application;

setupTestDatabase();

beforeEach(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  vi.clearAllMocks();
  vi.mocked(searchMemberPlatformProfilesWithAtlas).mockResolvedValue([]);
  vi.stubEnv("MEMBER_PLATFORM_MONGODB_DB", PLATFORM_DATABASE);
  await (await getClient()).db(PLATFORM_DATABASE).dropDatabase();
  const organizationId = newId();
  const id = newId();
  application = {
    _id: id,
    _creationTime: now,
    organizationId,
    jobPostingId: newId(),
    status: "review",
    applicantName: "Alex Beispiel",
    applicantEmail: "alex@example.com",
    applicantEmailNormalized: "alex@example.com",
    fields: [],
    files: [],
    tallyEventId: `event-${id}`,
    tallySubmissionId: `submission-${id}`,
    tallyResponseId: `response-${id}`,
    tallyFormId: "form-1",
    submittedAt: now,
  };
  await (await applications()).insertOne(application);
  vi.mocked(requirePermission).mockResolvedValue(
    createTestActor({ organizationId, role: "people_culture" }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

test("imports the birth date from one eligible member-platform profile", async () => {
  await insertPlatformProfile({
    id: "platform-adult",
    email: "ALEX@example.com",
    birthDate: "2004-01-01T00:00:00.000Z",
  });
  vi.mocked(searchMemberPlatformProfilesWithAtlas).mockResolvedValue([
    {
      id: "platform-adult",
      person: {
        firstName: "Alex",
        lastName: "Beispiel",
        birthDate: "2004-01-01T00:00:00.000Z",
      },
      contact: { email: "ALEX@example.com" },
    },
  ]);
  await expect(
    selectApplicationMemberPlatformProfileAction({
      applicationId: application._id,
      profileId: "platform-adult",
    }),
  ).resolves.toEqual({ ok: true });

  expect(
    await (await applications()).findOne({ _id: application._id }),
  ).toMatchObject({
    dateOfBirth: "2004-01-01",
    memberPlatformUserId: "platform-adult",
    memberPlatformSyncedAt: now,
  });
});

test("prefers an exact applicant name when the private email differs", async () => {
  await Promise.all([
    insertPlatformProfile({
      id: "platform-name-match",
      email: "new-address@example.com",
      birthDate: "2004-01-01T00:00:00.000Z",
    }),
    insertPlatformProfile({
      id: "platform-email-match",
      email: "alex@example.com",
      birthDate: "2003-01-01T00:00:00.000Z",
      firstName: "Andere",
      lastName: "Person",
    }),
  ]);

  await syncApplicationMemberPlatformProfile({
    applicationId: application._id,
  });

  expect(
    await (await applications()).findOne({ _id: application._id }),
  ).toMatchObject({
    dateOfBirth: "2004-01-01",
    memberPlatformUserId: "platform-name-match",
  });
});

test("uses the private email to disambiguate identical names", async () => {
  await Promise.all([
    insertPlatformProfile({
      id: "platform-other-alex",
      email: "other@example.com",
      birthDate: "2003-01-01T00:00:00.000Z",
    }),
    insertPlatformProfile({
      id: "platform-applicant",
      email: "alex@example.com",
      birthDate: "2004-01-01T00:00:00.000Z",
    }),
  ]);

  await syncApplicationMemberPlatformProfile({
    applicationId: application._id,
  });

  expect(
    await (await applications()).findOne({ _id: application._id }),
  ).toMatchObject({
    dateOfBirth: "2004-01-01",
    memberPlatformUserId: "platform-applicant",
  });
});

test("falls back to the private email when the application has no name", async () => {
  await insertPlatformProfile({
    id: "platform-email-fallback",
    email: "alex@example.com",
    birthDate: "2004-01-01T00:00:00.000Z",
    firstName: "Andere",
    lastName: "Person",
  });
  await (
    await applications()
  ).updateOne({ _id: application._id }, { $unset: { applicantName: "" } });

  await syncApplicationMemberPlatformProfile({
    applicationId: application._id,
  });

  expect(
    await (await applications()).findOne({ _id: application._id }),
  ).toMatchObject({ memberPlatformUserId: "platform-email-fallback" });
});

test("reports the email fallback when an application has no name", async () => {
  await (
    await applications()
  ).updateOne({ _id: application._id }, { $unset: { applicantName: "" } });

  await expect(
    syncApplicationMemberPlatformProfile({
      applicationId: application._id,
    }),
  ).rejects.toThrow("private Bewerbungs-E-Mail");
});

test("returns no candidates when no active member profile matches", async () => {
  await expect(
    searchApplicationMemberPlatformProfilesAction({
      applicationId: application._id,
    }),
  ).resolves.toEqual({ ok: true, candidates: [] });
  expect(
    await (await applications()).findOne({ _id: application._id }),
  ).not.toHaveProperty("dateOfBirth");
});

test("returns a safe result when Atlas Search fails", async () => {
  const error = new Error("Atlas Search failed");
  vi.mocked(searchMemberPlatformProfilesWithAtlas).mockRejectedValue(error);
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

  await expect(
    searchApplicationMemberPlatformProfilesAction({
      applicationId: application._id,
    }),
  ).resolves.toEqual({ ok: false });
  expect(consoleError).toHaveBeenCalledWith(
    "application member profile search failed",
    error,
  );
});

test("returns candidates from Atlas Search", async () => {
  vi.mocked(searchMemberPlatformProfilesWithAtlas).mockResolvedValue([
    {
      id: "platform-exact",
      person: {
        firstName: "Alex",
        lastName: "Beispiel",
        birthDate: "2004-01-01T00:00:00.000Z",
      },
      contact: { email: "alex@example.com" },
    },
    {
      id: "platform-partial",
      person: {
        firstName: "Alexander",
        lastName: "Beispiel",
        birthDate: "2003-02-02T00:00:00.000Z",
      },
      contact: { email: "anderer@example.com" },
    },
  ]);

  await expect(
    searchApplicationMemberPlatformProfilesAction({
      applicationId: application._id,
    }),
  ).resolves.toEqual({
    ok: true,
    candidates: [
      {
        id: "platform-exact",
        name: "Alex Beispiel",
        email: "alex@example.com",
        dateOfBirth: "2004-01-01",
      },
      {
        id: "platform-partial",
        name: "Alexander Beispiel",
        email: "anderer@example.com",
        dateOfBirth: "2003-02-02",
      },
    ],
  });
});

test("rejects ambiguous member-platform profiles with the same email", async () => {
  await Promise.all([
    insertPlatformProfile({
      id: "platform-1",
      email: "alex@example.com",
      birthDate: "2004-01-01T00:00:00.000Z",
    }),
    insertPlatformProfile({
      id: "platform-2",
      email: "alex@example.com",
      birthDate: "2004-01-01T00:00:00.000Z",
    }),
  ]);

  await expect(
    syncApplicationMemberPlatformProfile({
      applicationId: application._id,
    }),
  ).rejects.toThrow("Mehrere aktive");
});

test("checks every matching profile before accepting a unique claim", async () => {
  const profiles = [
    { id: "platform-active-1", state: "ACCEPTED" },
    { id: "platform-inactive-1", state: "REJECTED" },
    { id: "platform-inactive-2", state: "REJECTED" },
    { id: "platform-active-2", state: "ACCEPTED" },
  ];
  for (const profile of profiles) {
    await insertPlatformProfile({
      ...profile,
      email: "alex@example.com",
      birthDate: "2004-01-01T00:00:00.000Z",
    });
  }

  await expect(
    syncApplicationMemberPlatformProfile({
      applicationId: application._id,
    }),
  ).rejects.toThrow("Mehrere aktive");
});

async function insertPlatformProfile(input: {
  id: string;
  email: string;
  birthDate: string;
  state?: string;
  firstName?: string;
  lastName?: string;
}): Promise<void> {
  const database = (await getClient()).db(PLATFORM_DATABASE);
  await Promise.all([
    database.collection("users").insertOne({
      id: input.id,
      deletedAt: null,
      person: {
        firstName: input.firstName ?? "Alex",
        lastName: input.lastName ?? "Beispiel",
        birthDate: input.birthDate,
      },
      contact: { email: input.email },
    }),
    database.collection("user-states").insertOne({
      userId: input.id,
      current: input.state ?? "ACCEPTED",
    }),
  ]);
}
