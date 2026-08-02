import { afterEach, beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({ requirePermission: vi.fn() }));
vi.mock("../../email/brevo", () => ({ sendMail: vi.fn() }));
vi.mock("../../email/templates", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../email/templates")>();
  return {
    ...actual,
    BREVO_TEMPLATE_IDS: {
      ...actual.BREVO_TEMPLATE_IDS,
      MEMBERSHIP_GUARDIAN_CONSENT: 999,
    },
  };
});

import { requirePermission } from "../../auth/session";
import { getClient } from "../../db/client";
import { applications } from "../../db/collections";
import { newId } from "../../db/ids";
import type { Application } from "../../db/types";
import { sendMail } from "../../email/brevo";
import { BREVO_TEMPLATE_IDS } from "../../email/templates";
import { createTestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import {
  requestGuardianConsent,
  syncApplicationMemberPlatformProfile,
} from "./admissionRequirements";

const now = Date.parse("2026-07-31T10:00:00Z");
const PLATFORM_DATABASE = "application_admission_requirements_test";
let application: Application;

setupTestDatabase();

beforeEach(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  vi.clearAllMocks();
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
  vi.mocked(sendMail).mockResolvedValue({
    status: "sent",
    messageId: "message-1",
  });
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://ybase.example");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

test("imports the birth date from one eligible member-platform profile", async () => {
  await insertPlatformProfile({
    id: "platform-adult",
    email: "ALEX@example.com",
    birthDate: "2004-01-01T00:00:00.000Z",
  });
  await (
    await applications()
  ).updateOne(
    { _id: application._id },
    {
      $set: {
        guardianConsent: {
          representativeName: "Previous",
          representativeEmail: "previous@example.com",
          tokenHash: "pending-token",
          expiresAt: now + 1_000,
        },
      },
    },
  );
  await syncApplicationMemberPlatformProfile({
    applicationId: application._id,
  });

  expect(
    await (await applications()).findOne({ _id: application._id }),
  ).toMatchObject({
    dateOfBirth: "2004-01-01",
    memberPlatformUserId: "platform-adult",
    memberPlatformSyncedAt: now,
  });
  expect(
    await (await applications()).findOne({ _id: application._id }),
  ).not.toHaveProperty("guardianConsent");
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

test("sends a secure guardian link and stores only its hash", async () => {
  await seedMemberPlatformSnapshot("2009-01-01");
  await requestGuardianConsent({
    applicationId: application._id,
    representativeName: "Erika Beispiel",
    representativeEmail: "ERIKA@example.com",
  });

  const message = vi.mocked(sendMail).mock.calls[0]?.[0];
  const consentUrl = String(message?.params?.consentUrl);
  const token = consentUrl.split("/").at(-1);
  const stored = await (await applications()).findOne({ _id: application._id });
  expect(message).toMatchObject({
    to: [{ email: "erika@example.com", name: "Erika Beispiel" }],
    templateId: BREVO_TEMPLATE_IDS.MEMBERSHIP_GUARDIAN_CONSENT,
  });
  expect(token).toBeTruthy();
  expect(stored).toMatchObject({
    dateOfBirth: "2009-01-01",
    guardianConsent: {
      representativeEmail: "erika@example.com",
      lastSentAt: now,
    },
  });
  expect(stored?.guardianConsent?.tokenHash).not.toBe(token);
});

test("restores the previous request when email delivery fails", async () => {
  application.guardianConsent = {
    representativeName: "Previous",
    representativeEmail: "previous@example.com",
    tokenHash: "previous-token-hash",
    expiresAt: now + 1_000,
  };
  application.dateOfBirth = "2009-02-02";
  application.memberPlatformUserId = "platform-minor";
  application.memberPlatformSyncedAt = now;
  await (
    await applications()
  ).replaceOne({ _id: application._id }, application);
  vi.mocked(sendMail).mockResolvedValue({
    status: "skipped",
    reason: "disabled",
  });

  await expect(
    requestGuardianConsent({
      applicationId: application._id,
      representativeName: "Erika Beispiel",
      representativeEmail: "erika@example.com",
    }),
  ).rejects.toThrow("E-Mail");
  expect(
    await (await applications()).findOne({ _id: application._id }),
  ).toMatchObject({
    dateOfBirth: "2009-02-02",
    guardianConsent: application.guardianConsent,
  });
});

test("rejects synchronization without one matching active profile", async () => {
  await expect(
    syncApplicationMemberPlatformProfile({
      applicationId: application._id,
    }),
  ).rejects.toThrow("mit dem Namen");
  expect(
    await (await applications()).findOne({ _id: application._id }),
  ).not.toHaveProperty("dateOfBirth");
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

async function seedMemberPlatformSnapshot(dateOfBirth: string): Promise<void> {
  application.dateOfBirth = dateOfBirth;
  application.memberPlatformUserId = "platform-minor";
  application.memberPlatformSyncedAt = now;
  await (
    await applications()
  ).replaceOne({ _id: application._id }, application);
}

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
