import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../s3/storage", () => ({ deleteObject: vi.fn() }));

import { applications, logs, tallyWebhookEvents } from "../../db/collections";
import { newId } from "../../db/ids";
import type { Application } from "../../db/types";
import { deleteObject } from "../../s3/storage";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import {
  canWithdrawApplication,
  withdrawApplicationByToken,
} from "./withdrawal";
import { createApplicationWithdrawalToken } from "./withdrawalToken";

setupTestDatabase();

let applicationId: string;
let token: string;

beforeEach(async () => {
  vi.clearAllMocks();
  applicationId = newId();
  const withdrawal = createApplicationWithdrawalToken();
  token = withdrawal.token;
  const application: Application = {
    _id: applicationId,
    _creationTime: Date.now(),
    organizationId: newId(),
    jobPostingId: newId(),
    status: "interview",
    applicantName: "Secret Person",
    applicantEmail: "secret@example.com",
    applicantEmailNormalized: "secret@example.com",
    fields: [
      {
        key: "motivation",
        label: "Motivation",
        type: "TEXTAREA",
        value: "secret answer",
      },
    ],
    files: [
      {
        _id: "file-1",
        fieldKey: "cv",
        fieldLabel: "Lebenslauf",
        sourceUrl: "https://tally.example/secret",
        fileName: "Secret-Person.pdf",
        mimeType: "application/pdf",
        size: 12,
        status: "imported",
        attempts: 1,
        storageKey: "applications/secret-cv.pdf",
        updatedAt: Date.now(),
      },
    ],
    tallyEventId: "tally-event-secret",
    tallySubmissionId: "tally-submission-secret",
    tallyResponseId: "tally-response-secret",
    tallyFormId: "tally-form-secret",
    withdrawalTokenHash: withdrawal.tokenHash,
    submittedAt: Date.now(),
    ownerId: newId(),
    internalNotes: "secret note",
    interviewAt: Date.now() + 1_000,
  };
  await (await applications()).insertOne(application);
  await (
    await tallyWebhookEvents()
  ).insertOne({
    _id: application.tallyEventId,
    _creationTime: Date.now(),
    eventType: "FORM_RESPONSE",
    submissionId: application.tallySubmissionId,
    status: "processed",
    applicationId,
    organizationId: application.organizationId,
    jobPostingId: application.jobPostingId,
  });
});

test("anonymizes personal data, locks the application and removes files", async () => {
  expect(await canWithdrawApplication(token)).toBe(true);

  await withdrawApplicationByToken(token);

  const stored = await (await applications()).findOne({ _id: applicationId });
  expect(stored).toMatchObject({
    status: "withdrawn",
    applicantEmail: "",
    fields: [],
    files: [],
    tallyFormId: "",
    history: [expect.objectContaining({ toStatus: "withdrawn" })],
  });
  expect(stored).not.toHaveProperty("applicantName");
  expect(stored).not.toHaveProperty("internalNotes");
  expect(stored).not.toHaveProperty("withdrawalTokenHash");
  expect(JSON.stringify(stored)).not.toMatch(
    /Secret Person|secret@example.com|secret answer|secret note|tally-event-secret/,
  );
  expect(deleteObject).toHaveBeenCalledWith("applications/secret-cv.pdf");
  expect(
    await (await tallyWebhookEvents()).countDocuments({ applicationId }),
  ).toBe(0);
  expect(await canWithdrawApplication(token)).toBe(false);
  expect(
    await (await logs()).findOne({ entityId: applicationId }),
  ).toMatchObject({ action: "application.withdrawn", userId: "applicant" });
});

test("rejects an invalid or already consumed token without changing data", async () => {
  await expect(withdrawApplicationByToken("invalid")).rejects.toThrow(
    "ungültig",
  );
  expect(
    await (await applications()).findOne({ _id: applicationId }),
  ).toMatchObject({
    status: "interview",
    applicantEmail: "secret@example.com",
  });

  await withdrawApplicationByToken(token);
  await expect(withdrawApplicationByToken(token)).rejects.toThrow("ungültig");
});
