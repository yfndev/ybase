import { MongoMemoryServer } from "mongodb-memory-server";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  test,
  vi,
} from "vitest";

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

import { requireRole, requireUser } from "../../auth/session";
import { getClient, getDb } from "../../db/client";
import {
  organizations,
  projects,
  receipts,
  reimbursements,
  users,
} from "../../db/collections";
import { newId } from "../../db/ids";
import { deleteObject, getDownloadInfo } from "../../s3/storage";
import { approve, createReimbursement, deleteReimbursement } from "./actions";
import { getAllReimbursements, getFileInfo, getReimbursement } from "./data";

let mongod: MongoMemoryServer;
let orgA: string;
let orgB: string;
let userA: string;
let projectA: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.MONGODB_DB = "ybase_test";
}, 120_000);

afterAll(async () => {
  const client = await getClient();
  await client.close();
  await mongod.stop();
}, 30_000);

afterEach(() => {
  vi.unstubAllEnvs();
});

beforeEach(async () => {
  await (await getDb()).dropDatabase();
  vi.clearAllMocks();
  orgA = newId();
  orgB = newId();
  userA = newId();
  projectA = newId();
  await (
    await organizations()
  ).insertMany([
    {
      _id: orgA,
      _creationTime: Date.now(),
      name: "A",
      domain: "a.org",
      createdBy: userA,
      accountingEmail: "accounting@a.org",
    },
    {
      _id: orgB,
      _creationTime: Date.now(),
      name: "B",
      domain: "b.org",
      createdBy: newId(),
    },
  ]);
  await (
    await projects()
  ).insertOne({
    _id: projectA,
    _creationTime: Date.now(),
    name: "Projekt A",
    organizationId: orgA,
    isArchived: false,
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
  });
  const actor = {
    _id: userA,
    _creationTime: Date.now(),
    organizationId: orgA,
    role: "finance" as const,
  };
  vi.mocked(requireUser).mockResolvedValue(actor);
  vi.mocked(requireRole).mockResolvedValue(actor);
});

function reimbursementInput() {
  return {
    amount: 50,
    projectId: projectA,
    iban: "DE00",
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
});

test("getFileInfo returns signed download metadata", async () => {
  vi.stubEnv("IS_TEST", "false");

  await expect(getFileInfo("receipt-key")).resolves.toEqual({
    url: "signed-url",
    contentType: "application/pdf",
  });
  expect(getDownloadInfo).toHaveBeenCalledWith("receipt-key");
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
