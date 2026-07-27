import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createConfiguredTallyClient: vi.fn(),
  deleteForm: vi.fn(),
  deleteObject: vi.fn(),
  deleteWebhook: vi.fn(),
}));

vi.mock("../../auth/session", () => ({ requirePermission: vi.fn() }));
vi.mock("../../s3/storage", () => ({
  deleteObject: mocks.deleteObject,
}));
vi.mock("../tally/client", () => ({
  createConfiguredTallyClient: mocks.createConfiguredTallyClient,
}));

import { requirePermission } from "../../auth/session";
import {
  applications,
  jobPostings,
  logs,
  tallyWebhookEvents,
} from "../../db/collections";
import { newId } from "../../db/ids";
import type { Application, JobPosting } from "../../db/types";
import { createTestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { deleteJobPosting } from "./deletion";

let organizationId: string;
let actorId: string;

setupTestDatabase();

async function insertPosting(
  overrides: Partial<JobPosting> = {},
): Promise<JobPosting> {
  const posting: JobPosting = {
    _id: newId(),
    _creationTime: Date.now(),
    organizationId,
    teamId: newId(),
    status: "published",
    title: "Tech Lead",
    createdBy: actorId,
    ...overrides,
  };
  await (await jobPostings()).insertOne(posting);
  return posting;
}

function application(jobPostingId: string): Application {
  const id = newId();
  return {
    _id: id,
    _creationTime: Date.now(),
    organizationId,
    jobPostingId,
    status: "received",
    applicantEmail: "alex@example.com",
    applicantEmailNormalized: "alex@example.com",
    fields: [],
    files: [
      {
        _id: newId(),
        fieldKey: "cv",
        fieldLabel: "Lebenslauf",
        sourceUrl: "https://example.com/cv.pdf",
        fileName: "cv.pdf",
        mimeType: "application/pdf",
        size: 123,
        status: "imported",
        attempts: 1,
        storageKey: "applications/cv.pdf",
        updatedAt: Date.now(),
      },
    ],
    tallyEventId: `event-${id}`,
    tallySubmissionId: `submission-${id}`,
    tallyResponseId: `response-${id}`,
    tallyFormId: "form-1",
    submittedAt: Date.now(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  organizationId = newId();
  actorId = newId();
  vi.mocked(requirePermission).mockResolvedValue(
    createTestActor({
      _id: actorId,
      organizationId,
      role: "people_culture",
    }),
  );
  mocks.createConfiguredTallyClient.mockReturnValue({
    deleteForm: mocks.deleteForm,
    deleteWebhook: mocks.deleteWebhook,
  });
  mocks.deleteForm.mockResolvedValue(undefined);
  mocks.deleteObject.mockResolvedValue(undefined);
  mocks.deleteWebhook.mockResolvedValue(undefined);
});

test("deletes the posting, Tally sync, applications, and files", async () => {
  const posting = await insertPosting({
    tallyFormId: "form-1",
    tallyWebhookId: "webhook-1",
  });
  const record = application(posting._id);
  await (await applications()).insertOne(record);
  const foreignEventId = newId();
  await (
    await tallyWebhookEvents()
  ).insertOne({
    _id: record.tallyEventId,
    _creationTime: Date.now(),
    eventType: "FORM_RESPONSE",
    submissionId: record.tallySubmissionId,
    status: "processed",
    jobPostingId: posting._id,
    applicationId: record._id,
  });
  await (
    await tallyWebhookEvents()
  ).insertOne({
    _id: foreignEventId,
    _creationTime: Date.now(),
    eventType: "FORM_RESPONSE",
    submissionId: `foreign-${record.tallySubmissionId}`,
    status: "processed",
    organizationId: newId(),
    jobPostingId: posting._id,
  });

  await deleteJobPosting({ jobPostingId: posting._id });

  expect(mocks.deleteWebhook).toHaveBeenCalledWith("webhook-1");
  expect(mocks.deleteForm).toHaveBeenCalledWith("form-1");
  expect(mocks.deleteWebhook.mock.invocationCallOrder[0]).toBeLessThan(
    mocks.deleteForm.mock.invocationCallOrder[0],
  );
  expect(mocks.deleteObject).toHaveBeenCalledWith("applications/cv.pdf");
  expect(await (await jobPostings()).findOne({ _id: posting._id })).toBeNull();
  expect(await (await applications()).findOne({ _id: record._id })).toBeNull();
  expect(
    await (await tallyWebhookEvents()).findOne({ applicationId: record._id }),
  ).toBeNull();
  expect(
    await (await tallyWebhookEvents()).findOne({ _id: foreignEventId }),
  ).not.toBeNull();
  expect(await (await logs()).findOne({ entityId: posting._id })).toMatchObject(
    {
      action: "jobPosting.delete",
      userId: actorId,
    },
  );
});

test("deletes an unsynced draft without creating a Tally client", async () => {
  const posting = await insertPosting({ status: "draft" });

  await deleteJobPosting({ jobPostingId: posting._id });

  expect(mocks.createConfiguredTallyClient).not.toHaveBeenCalled();
  expect(await (await jobPostings()).findOne({ _id: posting._id })).toBeNull();
});

test("keeps local data when removing the Tally sync fails", async () => {
  const posting = await insertPosting({
    tallyFormId: "form-1",
    tallyWebhookId: "webhook-1",
  });
  const record = application(posting._id);
  await (await applications()).insertOne(record);
  mocks.deleteForm.mockRejectedValue(new Error("Tally down"));

  await expect(deleteJobPosting({ jobPostingId: posting._id })).rejects.toThrow(
    "Tally down",
  );

  expect(
    await (await jobPostings()).findOne({ _id: posting._id }),
  ).not.toBeNull();
  expect(
    await (await applications()).findOne({ _id: record._id }),
  ).not.toBeNull();
  expect(mocks.deleteObject).not.toHaveBeenCalled();
});

test("cannot delete a posting from another organization", async () => {
  const posting = await insertPosting({ organizationId: newId() });

  await expect(deleteJobPosting({ jobPostingId: posting._id })).rejects.toThrow(
    "Access denied",
  );

  expect(
    await (await jobPostings()).findOne({ _id: posting._id }),
  ).not.toBeNull();
  expect(mocks.createConfiguredTallyClient).not.toHaveBeenCalled();
});
