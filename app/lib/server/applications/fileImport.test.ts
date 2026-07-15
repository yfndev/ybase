import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({ requirePermission: vi.fn() }));

import type { Application, ApplicationFile } from "../../db/application";
import { applications } from "../../db/collections";
import { getClient, getDb } from "../../db/client";
import { newId } from "../../db/ids";
import { importApplicationFile } from "./fileImport";

let mongod: MongoMemoryServer;

async function insertApplication() {
  const applicationFile: ApplicationFile = {
    _id: newId(),
    fieldKey: "cv",
    fieldLabel: "Lebenslauf",
    sourceId: "tally-file-1",
    sourceUrl: "https://storage.tally.so/private/cv.pdf?token=secret",
    fileName: "Lebenslauf.pdf",
    mimeType: "application/pdf",
    size: 20,
    status: "pending",
    attempts: 0,
    updatedAt: Date.now(),
  };
  const application: Application = {
    _id: newId(),
    _creationTime: Date.now(),
    organizationId: newId(),
    jobPostingId: newId(),
    status: "received",
    applicantEmail: "person@example.com",
    applicantEmailNormalized: "person@example.com",
    fields: [],
    files: [applicationFile],
    tallyEventId: "event-1",
    tallySubmissionId: newId(),
    tallyResponseId: "response-1",
    tallyFormId: "form-1",
    submittedAt: Date.now(),
  };
  await (await applications()).insertOne(application);
  return { application, applicationFile };
}

function pdfResponse(): Response {
  return new Response(new TextEncoder().encode("%PDF-1.7 test"), {
    headers: { "content-type": "application/pdf" },
  });
}

function mockFetch(response: Response): typeof fetch {
  return vi.fn(async () => response) as unknown as typeof fetch;
}

function mockUploader() {
  return vi.fn(
    async (_key: string, _body: Uint8Array, _contentType: string) => undefined,
  );
}

async function findFile(applicationId: string) {
  const stored = await (await applications()).findOne({ _id: applicationId });
  return stored?.files[0];
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.MONGODB_DB = "ybase_file_import_test";
}, 120_000);

afterAll(async () => {
  const client = await getClient();
  await client.close();
  await mongod.stop();
}, 30_000);

beforeEach(async () => {
  await (await getDb()).dropDatabase();
});

test("imports a valid PDF under a deterministic storage key", async () => {
  const { application, applicationFile } = await insertApplication();
  const uploader = mockUploader();

  await importApplicationFile(application._id, applicationFile._id, {
    fetcher: mockFetch(pdfResponse()),
    uploader,
  });

  expect(uploader).toHaveBeenCalledOnce();
  expect(uploader.mock.calls[0][0]).toBe(
    `applications/${application._id}/${applicationFile._id}/Lebenslauf.pdf`,
  );
  const storedFile = await findFile(application._id);
  expect(storedFile).toMatchObject({
    status: "imported",
    attempts: 1,
    mimeType: "application/pdf",
  });
  expect(storedFile?.storageKey).toContain(applicationFile._id);
});

test("retries a failed download idempotently", async () => {
  const { application, applicationFile } = await insertApplication();
  const uploader = mockUploader();

  await importApplicationFile(application._id, applicationFile._id, {
    fetcher: mockFetch(new Response(null, { status: 503 })),
    uploader,
  });
  await importApplicationFile(application._id, applicationFile._id, {
    fetcher: mockFetch(pdfResponse()),
    uploader,
  });
  await importApplicationFile(application._id, applicationFile._id, {
    fetcher: mockFetch(pdfResponse()),
    uploader,
  });

  expect(uploader).toHaveBeenCalledOnce();
  expect(await findFile(application._id)).toMatchObject({
    status: "imported",
    attempts: 2,
  });
});

test("deletes an uploaded object when the application was withdrawn meanwhile", async () => {
  const { application, applicationFile } = await insertApplication();
  const deleter = vi.fn(async () => undefined);
  const uploader = vi.fn(async () => {
    await (
      await applications()
    ).updateOne(
      { _id: application._id },
      { $set: { status: "withdrawn", files: [] } },
    );
  });

  await importApplicationFile(application._id, applicationFile._id, {
    fetcher: mockFetch(pdfResponse()),
    uploader,
    deleter,
  });

  expect(deleter).toHaveBeenCalledWith(
    `applications/${application._id}/${applicationFile._id}/Lebenslauf.pdf`,
  );
});
