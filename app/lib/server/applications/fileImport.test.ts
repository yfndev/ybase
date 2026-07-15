import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";
import type { Application, ApplicationFile } from "../../db/application";
import { applications } from "../../db/collections";
import { getClient, getDb } from "../../db/client";
import { newId } from "../../db/ids";
import { importApplicationFile } from "./fileImport";

let mongod: MongoMemoryServer;

function file(overrides: Partial<ApplicationFile> = {}): ApplicationFile {
  return {
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
    ...overrides,
  };
}

async function insertApplication(applicationFile: ApplicationFile) {
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
  return application;
}

function pdfResponse(): Response {
  return new Response(new TextEncoder().encode("%PDF-1.7 test"), {
    headers: { "content-type": "application/pdf" },
  });
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
  const applicationFile = file();
  const application = await insertApplication(applicationFile);
  const uploader = vi.fn(
    async (_key: string, _body: Uint8Array, _contentType: string) => undefined,
  );

  await importApplicationFile(application._id, applicationFile._id, {
    fetcher: vi.fn(async () => pdfResponse()) as unknown as typeof fetch,
    uploader,
  });

  expect(uploader).toHaveBeenCalledOnce();
  expect(uploader.mock.calls[0][0]).toBe(
    `applications/${application._id}/${applicationFile._id}/Lebenslauf.pdf`,
  );
  const stored = await (await applications()).findOne({ _id: application._id });
  expect(stored?.files[0]).toMatchObject({
    status: "imported",
    attempts: 1,
    mimeType: "application/pdf",
  });
  expect(stored?.files[0].storageKey).toContain(applicationFile._id);
});

test("rejects unsupported types before downloading", async () => {
  const applicationFile = file({ mimeType: "application/msword" });
  const application = await insertApplication(applicationFile);
  const fetcher = vi.fn();

  await importApplicationFile(application._id, applicationFile._id, {
    fetcher: fetcher as unknown as typeof fetch,
  });

  expect(fetcher).not.toHaveBeenCalled();
  const stored = await (await applications()).findOne({ _id: application._id });
  expect(stored?.files[0]).toMatchObject({
    status: "rejected",
    error: "Dieser Dateityp ist nicht erlaubt.",
  });
});

test("rejects an oversized file before downloading", async () => {
  const applicationFile = file({ size: 10 * 1024 * 1024 + 1 });
  const application = await insertApplication(applicationFile);
  const fetcher = vi.fn();

  await importApplicationFile(application._id, applicationFile._id, {
    fetcher: fetcher as unknown as typeof fetch,
  });

  expect(fetcher).not.toHaveBeenCalled();
  const stored = await (await applications()).findOne({ _id: application._id });
  expect(stored?.files[0]).toMatchObject({
    status: "rejected",
    error: "Die Datei ist zu groß.",
  });
});

test("rejects a file whose content does not match its declared type", async () => {
  const applicationFile = file();
  const application = await insertApplication(applicationFile);

  await importApplicationFile(application._id, applicationFile._id, {
    fetcher: vi.fn(
      async () =>
        new Response("not a pdf", {
          headers: { "content-type": "application/octet-stream" },
        }),
    ) as unknown as typeof fetch,
  });

  const stored = await (await applications()).findOne({ _id: application._id });
  expect(stored?.files[0]).toMatchObject({
    status: "rejected",
    error: "Der Dateiinhalt ist nicht erlaubt.",
  });
});

test("retries a failed download idempotently", async () => {
  const applicationFile = file();
  const application = await insertApplication(applicationFile);
  const uploader = vi.fn(
    async (_key: string, _body: Uint8Array, _contentType: string) => undefined,
  );

  await importApplicationFile(application._id, applicationFile._id, {
    fetcher: vi.fn(
      async () => new Response(null, { status: 503 }),
    ) as unknown as typeof fetch,
    uploader,
  });
  await importApplicationFile(application._id, applicationFile._id, {
    fetcher: vi.fn(async () => pdfResponse()) as unknown as typeof fetch,
    uploader,
  });
  await importApplicationFile(application._id, applicationFile._id, {
    fetcher: vi.fn(async () => pdfResponse()) as unknown as typeof fetch,
    uploader,
  });

  expect(uploader).toHaveBeenCalledOnce();
  const stored = await (await applications()).findOne({ _id: application._id });
  expect(stored?.files[0]).toMatchObject({ status: "imported", attempts: 2 });
});
