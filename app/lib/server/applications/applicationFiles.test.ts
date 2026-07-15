import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({ requirePermission: vi.fn() }));
vi.mock("../../s3/storage", () => ({
  presignNamedDownload: vi.fn(async () => "https://signed.example/file"),
}));

import { requirePermission } from "../../auth/session";
import { applications, jobPostings } from "../../db/collections";
import { getClient, getDb } from "../../db/client";
import { newId } from "../../db/ids";
import type { Application, ApplicationFile } from "../../db/types";
import { presignNamedDownload } from "../../s3/storage";
import { getApplicationsForJobPosting } from "./data";
import {
  getApplicationFileDownloadUrl,
  queueApplicationFileRetry,
} from "./files";

let mongod: MongoMemoryServer;
let organizationId: string;
let jobPostingId: string;

function actor(actorOrganizationId = organizationId) {
  return {
    _id: newId(),
    _creationTime: Date.now(),
    organizationId: actorOrganizationId,
    role: "people_culture" as const,
    memberStatus: "active" as const,
    teamOnboardingStatus: "completed" as const,
  };
}

function applicationFile(status: ApplicationFile["status"]): ApplicationFile {
  return {
    _id: newId(),
    fieldKey: "cv",
    fieldLabel: "Lebenslauf",
    sourceUrl: "https://storage.tally.so/private/cv.pdf?secret=yes",
    fileName: "cv.pdf",
    mimeType: "application/pdf",
    size: 100,
    status,
    attempts: 1,
    storageKey:
      status === "imported" ? `applications/${newId()}/cv.pdf` : undefined,
    error: status === "failed" ? "Übertragung fehlgeschlagen." : undefined,
    updatedAt: Date.now(),
  };
}

async function insertApplication(files: ApplicationFile[]) {
  const application: Application = {
    _id: newId(),
    _creationTime: Date.now(),
    organizationId,
    jobPostingId,
    status: "received",
    applicantEmail: "person@example.com",
    applicantEmailNormalized: "person@example.com",
    fields: [],
    files,
    tallyEventId: newId(),
    tallySubmissionId: newId(),
    tallyResponseId: newId(),
    tallyFormId: "form-1",
    submittedAt: Date.now(),
  };
  await (await applications()).insertOne(application);
  return application;
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.MONGODB_DB = "ybase_application_files_test";
}, 120_000);

afterAll(async () => {
  const client = await getClient();
  await client.close();
  await mongod.stop();
}, 30_000);

beforeEach(async () => {
  await (await getDb()).dropDatabase();
  organizationId = newId();
  jobPostingId = newId();
  vi.mocked(requirePermission).mockResolvedValue(actor());
  await (
    await jobPostings()
  ).insertOne({
    _id: jobPostingId,
    _creationTime: Date.now(),
    organizationId,
    teamId: newId(),
    title: "Vorstand",
    status: "published",
    createdBy: newId(),
  });
});

test("never exposes source URLs or storage keys in application responses", async () => {
  await insertApplication([applicationFile("imported")]);

  const result = await getApplicationsForJobPosting(jobPostingId);

  expect(result).toHaveLength(1);
  expect(result[0].files[0]).not.toHaveProperty("sourceUrl");
  expect(result[0].files[0]).not.toHaveProperty("storageKey");
});

test("only signs an imported file from the actor's organization", async () => {
  const imported = applicationFile("imported");
  await insertApplication([imported]);

  await expect(getApplicationFileDownloadUrl(imported._id)).resolves.toBe(
    "https://signed.example/file",
  );
  expect(presignNamedDownload).toHaveBeenCalledWith(
    imported.storageKey,
    "cv.pdf",
  );

  vi.mocked(requirePermission).mockResolvedValue(actor(newId()));
  await expect(getApplicationFileDownloadUrl(imported._id)).rejects.toThrow(
    "Datei nicht verfügbar",
  );
});

test("queues failed imports repeatedly without creating a second file", async () => {
  const failed = applicationFile("failed");
  const application = await insertApplication([failed]);

  await expect(queueApplicationFileRetry(failed._id)).resolves.toBe(
    application._id,
  );
  await expect(queueApplicationFileRetry(failed._id)).resolves.toBe(
    application._id,
  );

  const stored = await (await applications()).findOne({ _id: application._id });
  expect(stored?.files).toHaveLength(1);
  expect(stored?.files[0]).toMatchObject({ status: "pending" });
  expect(stored?.files[0].error).toBeUndefined();
});
