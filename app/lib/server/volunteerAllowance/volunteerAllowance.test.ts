import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({
  requireUser: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock("../../s3/storage", () => ({
  presignDownload: vi.fn(),
  deleteObject: vi.fn(),
}));

vi.mock("./email", () => ({
  sendApprovalEmail: vi.fn(async () => {}),
  sendChangesRequestedEmail: vi.fn(async () => {}),
  sendRejectionEmail: vi.fn(async () => {}),
  sendSubmissionReceivedEmail: vi.fn(async () => {}),
  sendSubmissionRequestedEmail: vi.fn(async () => {}),
}));

import { requireRole, requireUser } from "../../auth/session";
import {
  signatureTokens,
  uploadOwnerships,
  users,
  volunteerAllowance,
} from "../../db/collections";
import { newId } from "../../db/ids";
import { deleteObject } from "../../s3/storage";
import {
  createTestActor,
  insertTestOrganization,
  insertTestProject,
} from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { submitPublicSignature } from "../signatures/public";
import { registerPendingUpload } from "../uploads/ownership";
import { create, remove } from "./actions";
import { getAll, getSignatureUrl } from "./data";
import {
  sendApprovalEmail,
  sendChangesRequestedEmail,
  sendRejectionEmail,
  sendSubmissionReceivedEmail,
  sendSubmissionRequestedEmail,
} from "./email";
import { submitPublicAllowance } from "./public";
import { approve, decline, markAsPaid, requestChanges } from "./reviewActions";
import { createLink } from "./sharing";

let orgA: string;
let orgB: string;
let userA: string;

function newAllowanceInput(projectId: string) {
  return {
    projectId,
    amount: 100,
    iban: "DE89370400440532013000",
    accountHolder: "Max Mustermann",
    activityDescription: "Helfen",
    startDate: "2026-01-01",
    endDate: "2026-01-31",
    volunteerName: "Max Mustermann",
    volunteerStreet: "Hauptstr. 1",
    volunteerPlz: "10115",
    volunteerCity: "Berlin",
    signatureStorageId: "sig-key",
  };
}

async function insertProject(): Promise<string> {
  const project = await insertTestProject({
    name: "Projekt A",
    organizationId: orgA,
    createdBy: userA,
  });
  return project._id;
}

setupTestDatabase();

beforeEach(async () => {
  vi.clearAllMocks();
  orgA = newId();
  orgB = newId();
  userA = newId();
  await insertTestOrganization({
    _id: orgA,
    name: "A",
    domain: "a.org",
    createdBy: userA,
    accountingEmail: "accounting@a.org",
  });
  await insertTestOrganization({
    _id: orgB,
    name: "B",
    domain: "b.org",
  });
  const actor = createTestActor({
    _id: userA,
    organizationId: orgA,
    role: "finance",
    email: "actor@a.org",
  });
  await (
    await users()
  ).insertOne({
    ...actor,
    name: "Actor",
  });
  vi.mocked(requireUser).mockResolvedValue(actor);
  vi.mocked(requireRole).mockResolvedValue(actor);
  await registerPendingUpload("sig-key", {
    organizationId: orgA,
    userId: userA,
    contextType: "user",
    contextId: userA,
  });
});

test("create + getAll stay scoped to the caller's org", async () => {
  const projectA = await insertProject();

  await create(newAllowanceInput(projectA));

  await (
    await volunteerAllowance()
  ).insertOne({
    _id: newId(),
    _creationTime: Date.now(),
    organizationId: orgA,
    projectId: projectA,
    amount: 75,
    status: "pending",
    iban: "DE75",
    accountHolder: "Other member",
    createdBy: newId(),
    activityDescription: "Other",
    startDate: "2026-01-01",
    endDate: "2026-01-31",
    volunteerName: "Other member",
    volunteerStreet: "x",
    volunteerPlz: "x",
    volunteerCity: "x",
    signatureStorageId: "other-member-key",
  });

  await (
    await volunteerAllowance()
  ).insertOne({
    _id: newId(),
    _creationTime: Date.now(),
    organizationId: orgB,
    projectId: newId(),
    amount: 50,
    status: "pending",
    iban: "DE00",
    accountHolder: "Fremd",
    createdBy: newId(),
    activityDescription: "Fremd",
    startDate: "2026-01-01",
    endDate: "2026-01-31",
    volunteerName: "Fremd",
    volunteerStreet: "x",
    volunteerPlz: "x",
    volunteerCity: "x",
    signatureStorageId: "other-key",
  });

  const list = await getAll();
  expect(list.map((item) => item.volunteerName).sort()).toEqual([
    "Max Mustermann",
    "Other member",
  ]);
  expect(list.every((item) => item.projectName === "Projekt A")).toBe(true);
});

test("create rejects missing bank details", async () => {
  const projectA = newId();

  await expect(
    create({
      ...newAllowanceInput(projectA),
      iban: "",
      accountHolder: "",
    }),
  ).rejects.toThrow();
});

test("creation rejects a signature upload owned by another user", async () => {
  const projectA = await insertProject();
  await registerPendingUpload("other-user-signature", {
    organizationId: orgA,
    userId: newId(),
    contextType: "user",
    contextId: newId(),
  });

  await expect(
    create({
      ...newAllowanceInput(projectA),
      signatureStorageId: "other-user-signature",
    }),
  ).rejects.toThrow("Upload does not belong to the current user");
  expect(
    await (await volunteerAllowance()).findOne({ amount: 100 }),
  ).toBeNull();
});

test("create persists the allowance as pending", async () => {
  const projectA = await insertProject();

  const id = await create(newAllowanceInput(projectA));
  const doc = await (await volunteerAllowance()).findOne({ _id: id });
  expect(doc?.status).toBe("pending");
  expect(doc?.organizationId).toBe(orgA);
  expect(sendSubmissionReceivedEmail).toHaveBeenCalledWith(id);
});

test("create transfers a completed mobile signature to the allowance", async () => {
  const projectA = await insertProject();
  const tokenId = newId();
  const token = crypto.randomUUID();
  await (
    await signatureTokens()
  ).insertOne({
    _id: tokenId,
    _creationTime: Date.now(),
    token,
    organizationId: orgA,
    createdBy: userA,
    expiresAt: Date.now() + 60_000,
    pendingSignatureStorageId: "mobile-allowance-signature",
  });
  await registerPendingUpload("mobile-allowance-signature", {
    organizationId: orgA,
    userId: userA,
    contextType: "signatureToken",
    contextId: tokenId,
  });
  await submitPublicSignature(token);

  const id = await create({
    ...newAllowanceInput(projectA),
    signatureStorageId: "mobile-allowance-signature",
  });

  expect(
    await (
      await uploadOwnerships()
    ).findOne({ _id: "mobile-allowance-signature" }),
  ).toMatchObject({
    claimedByType: "allowance",
    claimedById: id,
  });
});

test("creating an emailed allowance request sends the request template", async () => {
  const projectA = await insertProject();
  const id = await createLink({
    projectId: projectA,
    invitedName: "Erika",
    invitedEmail: "erika@example.com",
  });

  const doc = await (await volunteerAllowance()).findOne({ _id: id });
  expect(doc?.isSharedLink).toBe(true);
  expect(doc?.invitedEmail).toBe("erika@example.com");
  expect(sendSubmissionRequestedEmail).toHaveBeenCalledWith(id);
});

test("public allowance cannot claim another link's signature", async () => {
  const projectA = await insertProject();
  const id = await createLink({ projectId: projectA });
  await (
    await volunteerAllowance()
  ).updateOne(
    { _id: id },
    { $set: { pendingSignatureStorageId: "foreign-public-signature" } },
  );
  await registerPendingUpload("foreign-public-signature", {
    organizationId: orgA,
    userId: userA,
    contextType: "allowance",
    contextId: newId(),
  });

  await expect(
    submitPublicAllowance(id, {
      amount: 100,
      iban: "DE89370400440532013000",
      accountHolder: "External",
      activityDescription: "External",
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      volunteerName: "External",
      submitterEmail: "external@example.com",
      volunteerStreet: "Street 1",
      volunteerPlz: "10115",
      volunteerCity: "Berlin",
      signatureStorageId: "foreign-public-signature",
    }),
  ).rejects.toThrow("Upload does not belong to the current user");
  expect(
    (await (await volunteerAllowance()).findOne({ _id: id }))?.amount,
  ).toBe(0);
});

test("signature downloads reject another organization's allowance", async () => {
  const foreign = newId();
  await (
    await volunteerAllowance()
  ).insertOne({
    _id: foreign,
    _creationTime: Date.now(),
    organizationId: orgB,
    projectId: newId(),
    amount: 50,
    status: "pending",
    iban: "DE00",
    accountHolder: "Foreign",
    createdBy: newId(),
    activityDescription: "Foreign",
    startDate: "2026-01-01",
    endDate: "2026-01-31",
    volunteerName: "Foreign",
    volunteerStreet: "x",
    volunteerPlz: "x",
    volunteerCity: "x",
    signatureStorageId: "foreign-signature-key",
  });

  await expect(getSignatureUrl("foreign-signature-key")).rejects.toThrow(
    "File not found",
  );
});

test.each([
  [
    "foreign",
    () => insertTestProject({ organizationId: orgB, createdBy: newId() }),
  ],
  [
    "archived",
    () =>
      insertTestProject({
        organizationId: orgA,
        createdBy: userA,
        isArchived: true,
      }),
  ],
  ["unknown", async () => ({ _id: newId() })],
])("creation rejects a %s project", async (_label, createProject) => {
  const project = await createProject();
  await expect(create(newAllowanceInput(project._id))).rejects.toThrow(
    "Active project not found",
  );
});

test.each([
  [
    "foreign",
    () => insertTestProject({ organizationId: orgB, createdBy: newId() }),
  ],
  [
    "archived",
    () =>
      insertTestProject({
        organizationId: orgA,
        createdBy: userA,
        isArchived: true,
      }),
  ],
  ["unknown", async () => ({ _id: newId() })],
])("sharing rejects a %s project", async (_label, createProject) => {
  const project = await createProject();
  await expect(createLink({ projectId: project._id })).rejects.toThrow(
    "Active project not found",
  );
});

test("approve sets status approved", async () => {
  const projectA = await insertProject();

  const id = await create(newAllowanceInput(projectA));
  await approve({ id });
  expect(requireRole).toHaveBeenCalledWith("finance");

  const doc = await (await volunteerAllowance()).findOne({ _id: id });
  expect(doc?.status).toBe("approved");
  expect(doc?.reviewedBy).toBe(userA);
  expect(sendApprovalEmail).toHaveBeenCalledWith(id);
});

test("markAsPaid moves an approved allowance to paid", async () => {
  const projectA = await insertProject();
  const id = await create(newAllowanceInput(projectA));
  await approve({ id });
  await markAsPaid({ id });

  const doc = await (await volunteerAllowance()).findOne({ _id: id });
  expect(doc?.status).toBe("paid");
  expect(doc?.paidBy).toBe(userA);
  expect(doc?.paidAt).toEqual(expect.any(Number));
});

test("markAsPaid rejects an allowance that is not approved", async () => {
  const projectA = await insertProject();
  const id = await create(newAllowanceInput(projectA));

  await expect(markAsPaid({ id })).rejects.toThrow(
    "Approved allowance not found",
  );
});

test("markAsPaid rejects an approved allowance from another org", async () => {
  const foreign = newId();
  await (
    await volunteerAllowance()
  ).insertOne({
    _id: foreign,
    _creationTime: Date.now(),
    organizationId: orgB,
    projectId: newId(),
    amount: 50,
    status: "approved",
    iban: "DE00",
    accountHolder: "Foreign",
    createdBy: newId(),
    activityDescription: "Foreign",
    startDate: "2026-01-01",
    endDate: "2026-01-31",
    volunteerName: "Foreign",
    volunteerStreet: "x",
    volunteerPlz: "x",
    volunteerCity: "x",
  });

  await expect(markAsPaid({ id: foreign })).rejects.toThrow(
    "Approved allowance not found",
  );
  expect(
    (await (await volunteerAllowance()).findOne({ _id: foreign }))?.status,
  ).toBe("approved");
});

test("decline sets status and sends the review email", async () => {
  const projectA = await insertProject();

  const id = await create(newAllowanceInput(projectA));
  await decline({ id, rejectionNote: "Angaben fehlen" });

  const doc = await (await volunteerAllowance()).findOne({ _id: id });
  expect(doc?.status).toBe("declined");
  expect(doc?.rejectionNote).toBe("Angaben fehlen");
  expect(sendRejectionEmail).toHaveBeenCalledWith(id);
});

test("requestChanges opens the allowance for editing and sends an email", async () => {
  const projectA = await insertProject();

  const id = await create(newAllowanceInput(projectA));
  await requestChanges({ id, reviewNote: "Zeitraum korrigieren" });

  const doc = await (await volunteerAllowance()).findOne({ _id: id });
  expect(doc?.status).toBe("changes_requested");
  expect(doc?.reviewNote).toBe("Zeitraum korrigieren");
  expect(doc?.isSharedLink).toBe(true);
  expect(sendChangesRequestedEmail).toHaveBeenCalledWith(id);
});

test("remove deletes the signature from S3 and the document", async () => {
  const projectA = await insertProject();

  const id = await create(newAllowanceInput(projectA));
  await remove({ id });

  expect(deleteObject).toHaveBeenCalledWith("sig-key");
  expect(await (await volunteerAllowance()).findOne({ _id: id })).toBeNull();
});

test("finance can delete another member's allowance", async () => {
  const allowanceId = newId();
  await (
    await volunteerAllowance()
  ).insertOne({
    _id: allowanceId,
    _creationTime: Date.now(),
    organizationId: orgA,
    projectId: newId(),
    amount: 75,
    status: "pending",
    iban: "DE75",
    accountHolder: "Other member",
    createdBy: newId(),
    activityDescription: "Other",
    startDate: "2026-01-01",
    endDate: "2026-01-31",
    volunteerName: "Other member",
    volunteerStreet: "x",
    volunteerPlz: "x",
    volunteerCity: "x",
    signatureStorageId: "other-member-key",
  });

  await remove({ id: allowanceId });

  expect(
    await (await volunteerAllowance()).findOne({ _id: allowanceId }),
  ).toBeNull();
});

test("cannot approve an allowance from another org", async () => {
  const foreign = newId();
  await (
    await volunteerAllowance()
  ).insertOne({
    _id: foreign,
    _creationTime: Date.now(),
    organizationId: orgB,
    projectId: newId(),
    amount: 50,
    status: "pending",
    iban: "DE00",
    accountHolder: "Fremd",
    createdBy: newId(),
    activityDescription: "Fremd",
    startDate: "2026-01-01",
    endDate: "2026-01-31",
    volunteerName: "Fremd",
    volunteerStreet: "x",
    volunteerPlz: "x",
    volunteerCity: "x",
    signatureStorageId: "other-key",
  });

  await expect(approve({ id: foreign })).rejects.toThrow("Not found");
});
