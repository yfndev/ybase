import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({ requireAuthenticatedUser: vi.fn() }));
vi.mock("../../s3/storage", () => ({
  getObjectBuffer: vi.fn(async () => Buffer.alloc(128)),
  getObjectSize: vi.fn(async () => 128),
  putObject: vi.fn(),
}));
vi.mock("./documentContent", () => ({ loadDocumentContent: vi.fn() }));
vi.mock("./requestMetadata", () => ({ membershipRequestMetadata: vi.fn() }));
vi.mock("./signingPdf", () => ({
  createExecutionPdf: vi.fn(),
  validateSignaturePng: vi.fn((bytes: Uint8Array) => bytes),
}));

import { requireAuthenticatedUser } from "../../auth/session";
import {
  documentExecutions,
  documentVersions,
  membershipEvents,
  memberships,
  uploadOwnerships,
} from "../../db/collections";
import { newId } from "../../db/ids";
import type { DocumentExecution, Membership } from "../../db/types";
import { putObject } from "../../s3/storage";
import { createTestActor, type TestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { loadDocumentContent } from "./documentContent";
import { completeOwnDocument } from "./documentExecution";
import { membershipRequestMetadata } from "./requestMetadata";
import { createExecutionPdf } from "./signingPdf";
import { registerPendingUpload } from "../uploads/ownership";

setupTestDatabase();

let actor: TestActor;
let membership: Membership;
let execution: DocumentExecution;

beforeEach(async () => {
  vi.clearAllMocks();
  const now = Date.now();
  const organizationId = newId();
  actor = createTestActor({
    organizationId,
    role: "member",
    memberStatus: "onboarding",
  });
  membership = {
    _id: newId(),
    _creationTime: now,
    organizationId,
    userId: actor._id,
    applicationId: newId(),
    membershipNumber: newId(),
    isCurrent: true,
    legalStatus: "active",
    admittedAt: now,
    privateEmail: "member@example.org",
    firstName: "Alex",
    lastName: "Example",
    dateOfBirth: "2005-01-01",
    handoverTasks: [],
    updatedAt: now,
  };
  const versionId = newId();
  execution = {
    _id: newId(),
    _creationTime: now,
    organizationId,
    documentVersionId: versionId,
    documentHash: "document-hash",
    membershipId: membership._id,
    userId: actor._id,
    executionType: "optional_consent",
    status: "assigned",
    assignedAt: now,
  };
  await (await memberships()).insertOne(membership);
  await (
    await documentVersions()
  ).insertOne({
    _id: versionId,
    _creationTime: now,
    organizationId,
    kind: "optional_consent",
    title: "Fotoeinwilligung",
    versionLabel: "2026-01",
    contentStorageKey: `documents/${versionId}/content.html`,
    sha256: execution.documentHash,
    publishedAt: now,
    publishedBy: newId(),
    targetTeamIds: [],
    targetDepartmentIds: [],
    executionType: "optional_consent",
    isActive: true,
  });
  await (await documentExecutions()).insertOne(execution);
  vi.mocked(requireAuthenticatedUser).mockResolvedValue(actor);
  vi.mocked(loadDocumentContent).mockResolvedValue("<p>Dokumententext</p>");
  vi.mocked(createExecutionPdf).mockResolvedValue(new Uint8Array([1, 2, 3]));
  vi.mocked(membershipRequestMetadata).mockResolvedValue({
    ipAddress: "192.0.2.1",
    userAgent: "test",
  });
  vi.mocked(putObject).mockResolvedValue(undefined);
});

test("records a declined optional consent as a completed execution", async () => {
  await completeOwnDocument({
    executionId: execution._id,
    consentGranted: false,
  });

  expect(loadDocumentContent).toHaveBeenCalledWith(
    `documents/${execution.documentVersionId}/content.html`,
    execution.documentHash,
  );
  expect(createExecutionPdf).toHaveBeenCalledWith(
    expect.objectContaining({
      contentHtml: "<p>Dokumententext</p>",
      membershipId: membership._id,
      userId: actor._id,
      consentGranted: false,
    }),
  );
  expect(putObject).toHaveBeenCalledOnce();
  expect(
    await (await documentExecutions()).findOne({ _id: execution._id }),
  ).toMatchObject({
    status: "completed",
    consentGranted: false,
    completedPdfStorageKey: expect.stringContaining(execution._id),
    ipAddress: "192.0.2.1",
  });
  expect(
    await (await membershipEvents()).findOne({ membershipId: membership._id }),
  ).toMatchObject({ type: "document.completed", actorUserId: actor._id });
});

test("requires an explicit choice for an optional consent", async () => {
  await expect(
    completeOwnDocument({ executionId: execution._id }),
  ).rejects.toThrow("freiwillige Auswahl");
  expect(putObject).not.toHaveBeenCalled();
});

test("rejects consent data on a regular acknowledgement", async () => {
  await Promise.all([
    (await documentExecutions()).updateOne(
      { _id: execution._id },
      { $set: { executionType: "acknowledgement" } },
    ),
    (await documentVersions()).updateOne(
      { _id: execution.documentVersionId },
      { $set: { executionType: "acknowledgement" } },
    ),
  ]);

  await expect(
    completeOwnDocument({ executionId: execution._id, consentGranted: true }),
  ).rejects.toThrow("keine freiwillige Einwilligung");
  expect(putObject).not.toHaveBeenCalled();
});

test("claims and stores an uploaded signature for a signature document", async () => {
  await Promise.all([
    (await documentExecutions()).updateOne(
      { _id: execution._id },
      { $set: { executionType: "signature" } },
    ),
    (await documentVersions()).updateOne(
      { _id: execution.documentVersionId },
      { $set: { executionType: "signature" } },
    ),
  ]);
  await registerPendingUpload("signature-key", {
    organizationId: membership.organizationId,
    userId: actor._id,
    contextType: "user",
    contextId: actor._id,
  });

  await completeOwnDocument({
    executionId: execution._id,
    signatureStorageKey: "signature-key",
  });

  expect(createExecutionPdf).toHaveBeenCalledWith(
    expect.objectContaining({ signaturePng: expect.any(Uint8Array) }),
  );
  expect(
    await (await documentExecutions()).findOne({ _id: execution._id }),
  ).toMatchObject({
    status: "completed",
    signatureStorageKey: "signature-key",
  });
  expect(
    await (await uploadOwnerships()).findOne({ _id: "signature-key" }),
  ).toMatchObject({
    claimedByType: "membershipDocument",
    claimedById: execution._id,
  });
});

test("repairs a missing audit event without regenerating the document", async () => {
  await (
    await documentExecutions()
  ).updateOne(
    { _id: execution._id },
    { $set: { status: "completed", completedAt: Date.now() } },
  );

  await completeOwnDocument({ executionId: execution._id });

  expect(putObject).not.toHaveBeenCalled();
  expect(
    await (await membershipEvents()).findOne({ membershipId: membership._id }),
  ).toMatchObject({
    type: "document.completed",
    idempotencyKey: `document-execution:${execution._id}:completed`,
  });
});
