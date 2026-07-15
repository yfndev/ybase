import { afterEach, beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({
  requireUser: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock("../../s3/storage", () => ({
  presignUpload: vi.fn(async () => ({ key: "key", url: "url" })),
  presignDownload: vi.fn(async () => "url"),
  getDownloadInfo: vi.fn(async () => ({
    url: "signed-url",
    contentType: "application/pdf",
  })),
  deleteObject: vi.fn(async () => {}),
  getObjectBuffer: vi.fn(async () => Buffer.from("file")),
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
  receipts,
  reimbursements,
  travelDetails,
  users,
} from "../../db/collections";
import { newId } from "../../db/ids";
import {
  createTestActor,
  insertTestOrganization,
  insertTestProject,
} from "../../test/fixtures";
import { deleteObject, getDownloadInfo } from "../../s3/storage";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import {
  approve,
  createReimbursement,
  createTravelReimbursement,
  decline,
  deleteReimbursement,
  getReimbursementPdfData,
  requestChanges,
} from "./actions";
import { getAllReimbursements, getFileInfo, getReimbursement } from "./data";
import {
  sendApprovalEmail,
  sendChangesRequestedEmail,
  sendRejectionEmail,
  sendSubmissionReceivedEmail,
  sendSubmissionRequestedEmail,
} from "./email";
import { createReimbursementLink } from "./sharing";

let orgA: string;
let orgB: string;
let userA: string;
let projectA: string;

setupTestDatabase();

afterEach(() => {
  vi.unstubAllEnvs();
});

beforeEach(async () => {
  vi.clearAllMocks();
  orgA = newId();
  orgB = newId();
  userA = newId();
  projectA = newId();
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
  await insertTestProject({
    _id: projectA,
    name: "Projekt A",
    organizationId: orgA,
    createdBy: userA,
  });
  await (
    await users()
  ).insertOne({
    _id: userA,
    _creationTime: Date.now(),
    name: "Max",
    email: "max@a.org",
    organizationId: orgA,
    role: "finance",
    memberStatus: "active",
    teamOnboardingStatus: "completed",
  });
  const actor = createTestActor({
    _id: userA,
    organizationId: orgA,
    role: "finance",
  });
  vi.mocked(requireUser).mockResolvedValue(actor);
  vi.mocked(requireRole).mockResolvedValue(actor);
});

function reimbursementInput() {
  return {
    amount: 50,
    projectId: projectA,
    iban: "DE89370400440532013000",
    accountHolder: "Max",
    signatureStorageId: "sig-key",
    receipts: [
      {
        receiptDate: "2026-01-01",
        companyName: "Firma",
        description: "Material",
        netAmount: 42,
        taxRate: 19,
        grossAmount: 50,
        fileStorageId: "receipt-key",
      },
    ],
  };
}

test("createReimbursement writes the reimbursement and receipts scoped to the org", async () => {
  const id = await createReimbursement(reimbursementInput());

  const stored = await (await reimbursements()).findOne({ _id: id });
  expect(stored?.organizationId).toBe(orgA);
  expect(stored?.status).toBe("pending");

  const receiptList = await (await receipts())
    .find({ reimbursementId: id })
    .toArray();
  expect(receiptList).toHaveLength(1);
  expect(receiptList[0]?.fileStorageId).toBe("receipt-key");
  expect(sendSubmissionReceivedEmail).toHaveBeenCalledWith(id);
});

test("travel PDF data includes travel details and the project name", async () => {
  const id = await createTravelReimbursement({
    ...reimbursementInput(),
    startDate: "2026-05-15",
    startTime: "08:00",
    endDate: "2026-05-20",
    endTime: "18:00",
    destination: "Berlin",
    purpose: "Event",
    isInternational: false,
    receipts: [
      {
        ...reimbursementInput().receipts[0],
        costType: "train",
      },
    ],
  });

  expect(
    await (await travelDetails()).findOne({ reimbursementId: id }),
  ).toMatchObject({ destination: "Berlin", purpose: "Event" });
  await expect(getReimbursementPdfData(id)).resolves.toMatchObject({
    projectName: "Projekt A",
    reimbursement: {
      type: "travel",
      travelDetails: { destination: "Berlin", purpose: "Event" },
    },
  });
});

test("creates a kilometer allowance without requiring a receipt file", async () => {
  const input = reimbursementInput();
  const id = await createTravelReimbursement({
    ...input,
    amount: 30,
    startDate: "2026-05-15",
    startTime: "08:00",
    endDate: "2026-05-15",
    endTime: "18:00",
    destination: "Berlin",
    purpose: "Workshop",
    isInternational: false,
    receipts: [
      {
        costType: "car",
        receiptDate: "2026-05-15",
        companyName: "Privater PKW",
        description: "",
        netAmount: 30,
        taxRate: 0,
        grossAmount: 30,
        kilometers: 100,
      },
    ],
  });

  const receipt = await (await receipts()).findOne({ reimbursementId: id });
  expect(receipt).toMatchObject({
    costType: "car",
    kilometers: 100,
    grossAmount: 30,
    fileStorageId: "",
  });
});

test("creating an emailed submission request sends the request template", async () => {
  const id = await createReimbursementLink({
    projectId: projectA,
    type: "expense",
    invitedName: "Erika",
    invitedEmail: "erika@example.com",
  });

  const stored = await (await reimbursements()).findOne({ _id: id });
  expect(stored?.invitedEmail).toBe("erika@example.com");
  expect(sendSubmissionRequestedEmail).toHaveBeenCalledWith(id);
});

test("getFileInfo returns signed download metadata", async () => {
  vi.stubEnv("IS_TEST", "false");

  await expect(getFileInfo("receipt-key")).resolves.toEqual({
    url: "signed-url",
    contentType: "application/pdf",
  });
  expect(getDownloadInfo).toHaveBeenCalledWith("receipt-key");
});

test("createReimbursement rejects missing bank details", async () => {
  await expect(
    createReimbursement({
      ...reimbursementInput(),
      iban: "",
      accountHolder: "",
    }),
  ).rejects.toThrow();
});

test("getAllReimbursements stays scoped to the caller's org", async () => {
  await createReimbursement(reimbursementInput());
  await (
    await reimbursements()
  ).insertOne({
    _id: newId(),
    _creationTime: Date.now(),
    organizationId: orgA,
    projectId: projectA,
    amount: 75,
    type: "expense",
    status: "pending",
    iban: "DE75",
    accountHolder: "Other member",
    createdBy: newId(),
  });
  await (
    await reimbursements()
  ).insertOne({
    _id: newId(),
    _creationTime: Date.now(),
    organizationId: orgB,
    projectId: newId(),
    amount: 99,
    type: "expense",
    status: "pending",
    iban: "DE99",
    accountHolder: "Fremd",
    createdBy: newId(),
  });

  const list = await getAllReimbursements();
  expect(list).toHaveLength(2);
  expect(list.every((item) => item.organizationId === orgA)).toBe(true);
  expect(list.every((item) => item.projectName === "Projekt A")).toBe(true);
  expect(list.find((item) => item.createdBy === userA)?.receiptSummary).toBe(
    "Material",
  );
});

test("members only see their own reimbursements", async () => {
  await createReimbursement(reimbursementInput());
  await (
    await reimbursements()
  ).insertOne({
    _id: newId(),
    _creationTime: Date.now(),
    organizationId: orgA,
    projectId: projectA,
    amount: 75,
    type: "expense",
    status: "pending",
    iban: "DE75",
    accountHolder: "Other member",
    createdBy: newId(),
  });
  vi.mocked(requireUser).mockResolvedValue({
    _id: userA,
    _creationTime: Date.now(),
    organizationId: orgA,
    role: "member",
    memberStatus: "active",
    teamOnboardingStatus: "completed",
  });

  const list = await getAllReimbursements();
  expect(list).toHaveLength(1);
  expect(list[0]?.createdBy).toBe(userA);
});

test("members cannot open another member's reimbursement", async () => {
  const reimbursementId = newId();
  await (
    await reimbursements()
  ).insertOne({
    _id: reimbursementId,
    _creationTime: Date.now(),
    organizationId: orgA,
    projectId: projectA,
    amount: 75,
    type: "expense",
    status: "pending",
    iban: "DE75",
    accountHolder: "Other member",
    createdBy: newId(),
  });
  vi.mocked(requireUser).mockResolvedValue({
    _id: userA,
    _creationTime: Date.now(),
    organizationId: orgA,
    role: "member",
    memberStatus: "active",
    teamOnboardingStatus: "completed",
  });

  await expect(getReimbursement(reimbursementId)).resolves.toBeNull();
});

test("approve sets the status", async () => {
  const id = await createReimbursement(reimbursementInput());
  await approve({ reimbursementId: id });
  expect(requireRole).toHaveBeenCalledWith("finance");

  const stored = await (await reimbursements()).findOne({ _id: id });
  expect(stored?.status).toBe("approved");
  expect(stored?.reviewedBy).toBe(userA);
  expect(sendApprovalEmail).toHaveBeenCalledWith(id);
});

test("decline sets the status and sends the review email", async () => {
  const id = await createReimbursement(reimbursementInput());
  await decline({ reimbursementId: id, rejectionNote: "Beleg fehlt" });

  const stored = await (await reimbursements()).findOne({ _id: id });
  expect(stored?.status).toBe("declined");
  expect(stored?.rejectionNote).toBe("Beleg fehlt");
  expect(sendRejectionEmail).toHaveBeenCalledWith(id);
});

test("requestChanges opens the submission for editing and sends an email", async () => {
  const id = await createReimbursement(reimbursementInput());
  await requestChanges({ reimbursementId: id, reviewNote: "Beleg ergänzen" });

  const stored = await (await reimbursements()).findOne({ _id: id });
  expect(stored?.status).toBe("changes_requested");
  expect(stored?.reviewNote).toBe("Beleg ergänzen");
  expect(stored?.isSharedLink).toBe(true);
  expect(sendChangesRequestedEmail).toHaveBeenCalledWith(id);
});

test("deleteReimbursement removes receipts and deletes the stored files", async () => {
  const id = await createReimbursement(reimbursementInput());
  await deleteReimbursement({ reimbursementId: id });

  expect(await (await reimbursements()).findOne({ _id: id })).toBeNull();
  expect(
    await (await receipts()).find({ reimbursementId: id }).toArray(),
  ).toHaveLength(0);
  expect(deleteObject).toHaveBeenCalledWith("receipt-key");
  expect(deleteObject).toHaveBeenCalledWith("sig-key");
});

test("finance can delete another member's reimbursement", async () => {
  const reimbursementId = newId();
  await (
    await reimbursements()
  ).insertOne({
    _id: reimbursementId,
    _creationTime: Date.now(),
    organizationId: orgA,
    projectId: projectA,
    amount: 75,
    type: "expense",
    status: "pending",
    iban: "DE75",
    accountHolder: "Other member",
    createdBy: newId(),
  });

  await deleteReimbursement({ reimbursementId });

  expect(
    await (await reimbursements()).findOne({ _id: reimbursementId }),
  ).toBeNull();
});

test("cannot delete a reimbursement from another org", async () => {
  const foreign = newId();
  await (
    await reimbursements()
  ).insertOne({
    _id: foreign,
    _creationTime: Date.now(),
    organizationId: orgB,
    projectId: newId(),
    amount: 10,
    type: "expense",
    status: "pending",
    iban: "DE00",
    accountHolder: "x",
    createdBy: newId(),
  });

  await expect(
    deleteReimbursement({ reimbursementId: foreign }),
  ).rejects.toThrow("Reimbursement not found");
});
