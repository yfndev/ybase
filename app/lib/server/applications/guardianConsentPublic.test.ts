import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../s3/storage", () => ({ putObject: vi.fn() }));
vi.mock("../memberships/requestMetadata", () => ({
  membershipRequestMetadata: vi.fn(),
}));
vi.mock("../memberships/signingPdf", () => ({
  decodeSignatureDataUrl: vi.fn(),
}));
vi.mock("./guardianConsentPdf", () => ({ createGuardianConsentPdf: vi.fn() }));

import { applications } from "../../db/collections";
import { newId } from "../../db/ids";
import type { Application } from "../../db/types";
import { putObject } from "../../s3/storage";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { membershipRequestMetadata } from "../memberships/requestMetadata";
import { decodeSignatureDataUrl } from "../memberships/signingPdf";
import { createGuardianConsentPdf } from "./guardianConsentPdf";
import {
  completeGuardianConsent,
  validateGuardianConsentToken,
} from "./guardianConsentPublic";
import {
  createGuardianConsentToken,
  hashGuardianConsentToken,
} from "./guardianConsentToken";

let application: Application;
let token: string;

setupTestDatabase();

beforeEach(async () => {
  vi.clearAllMocks();
  const now = Date.now();
  const generated = createGuardianConsentToken();
  token = generated.token;
  const id = newId();
  application = {
    _id: id,
    _creationTime: now,
    organizationId: newId(),
    jobPostingId: newId(),
    status: "review",
    applicantName: "Alex Beispiel",
    applicantEmail: "alex@example.com",
    applicantEmailNormalized: "alex@example.com",
    dateOfBirth: "2009-01-01",
    guardianConsent: {
      representativeName: "Erika Beispiel",
      representativeEmail: "erika@example.com",
      tokenHash: generated.tokenHash,
      expiresAt: now + 60_000,
    },
    fields: [],
    files: [],
    tallyEventId: `event-${id}`,
    tallySubmissionId: `submission-${id}`,
    tallyResponseId: `response-${id}`,
    tallyFormId: "form-1",
    submittedAt: now,
  };
  await (await applications()).insertOne(application);
  vi.mocked(decodeSignatureDataUrl).mockReturnValue(new Uint8Array([1, 2, 3]));
  vi.mocked(createGuardianConsentPdf).mockResolvedValue(new Uint8Array([4, 5]));
  vi.mocked(membershipRequestMetadata).mockResolvedValue({
    ipAddress: "192.0.2.1",
    userAgent: "test",
  });
  vi.mocked(putObject).mockResolvedValue(undefined);
});

test("validates only the exact open token", async () => {
  await expect(validateGuardianConsentToken(token)).resolves.toMatchObject({
    valid: true,
    applicantName: "Alex Beispiel",
    representativeName: "Erika Beispiel",
  });
  await expect(validateGuardianConsentToken(`${token}x`)).resolves.toEqual({
    valid: false,
    error: "Link ungültig",
  });
  expect(application.guardianConsent?.tokenHash).toBe(
    hashGuardianConsentToken(token),
  );
});

test("binds the signature and completion pdf to the application", async () => {
  await completeGuardianConsent(token, "data:image/png;base64,signature");

  const stored = await (await applications()).findOne({ _id: application._id });
  expect(putObject).toHaveBeenCalledTimes(2);
  expect(stored?.guardianConsent).toMatchObject({
    signedAt: expect.any(Number),
    signatureStorageKey: expect.stringContaining(application._id),
    completedPdfStorageKey: expect.stringContaining(application._id),
    ipAddress: "192.0.2.1",
  });
  expect(stored?.history?.at(-1)).toMatchObject({
    type: "guardian_consent_recorded",
    actorUserId: "public-link",
  });
  await expect(validateGuardianConsentToken(token)).resolves.toEqual({
    valid: false,
    error: "Zustimmung bereits erteilt",
  });
});

test("invalidates the link when the application is no longer open", async () => {
  await (
    await applications()
  ).updateOne({ _id: application._id }, { $set: { status: "rejected" } });

  await expect(validateGuardianConsentToken(token)).resolves.toEqual({
    valid: false,
    error: "Link ungültig",
  });
  await expect(
    completeGuardianConsent(token, "data:image/png;base64,signature"),
  ).rejects.toThrow("Link ungültig");
  expect(putObject).not.toHaveBeenCalled();
});
