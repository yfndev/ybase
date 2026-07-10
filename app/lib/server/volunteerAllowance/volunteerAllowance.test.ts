import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({
  requireUser: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock("../../s3/storage", () => ({
  presignDownload: vi.fn(),
  deleteObject: vi.fn(),
}));

import { requireRole, requireUser } from "../../auth/session";
import { getClient, getDb } from "../../db/client";
import {
  organizations,
  projects,
  users,
  volunteerAllowance,
} from "../../db/collections";
import { newId } from "../../db/ids";
import { deleteObject } from "../../s3/storage";
import { approve, create, remove } from "./actions";
import { getAll } from "./data";

let mongod: MongoMemoryServer;
let orgA: string;
let orgB: string;
let userA: string;

function newAllowanceInput(projectId: string) {
  return {
    projectId,
    amount: 100,
    iban: "DE00",
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

beforeEach(async () => {
  await (await getDb()).dropDatabase();
  vi.clearAllMocks();
  orgA = newId();
  orgB = newId();
  userA = newId();
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
  const actor = {
    _id: userA,
    _creationTime: Date.now(),
    organizationId: orgA,
    role: "finance" as const,
    email: "actor@a.org",
  };
  await (
    await users()
  ).insertOne({
    _id: userA,
    _creationTime: Date.now(),
    name: "Actor",
    organizationId: orgA,
    role: "finance",
    email: "actor@a.org",
  });
  vi.mocked(requireUser).mockResolvedValue(actor);
  vi.mocked(requireRole).mockResolvedValue(actor);
});

test("create + getAll stay scoped to the caller's org", async () => {
  const projectA = newId();
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

test("create persists the allowance as pending", async () => {
  const projectA = newId();
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

  const id = await create(newAllowanceInput(projectA));
  const doc = await (await volunteerAllowance()).findOne({ _id: id });
  expect(doc?.status).toBe("pending");
  expect(doc?.organizationId).toBe(orgA);
});

test("approve sets status approved", async () => {
  const projectA = newId();
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

  const id = await create(newAllowanceInput(projectA));
  await approve({ id });
  expect(requireRole).toHaveBeenCalledWith("finance");

  const doc = await (await volunteerAllowance()).findOne({ _id: id });
  expect(doc?.status).toBe("approved");
  expect(doc?.reviewedBy).toBe(userA);
});

test("remove deletes the signature from S3 and the document", async () => {
  const projectA = newId();
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

  const id = await create(newAllowanceInput(projectA));
  await remove({ id });

  expect(deleteObject).toHaveBeenCalledWith("sig-key");
  expect(await (await volunteerAllowance()).findOne({ _id: id })).toBeNull();
});

test("finance can delete another member's allowance", async () => {
  const allowanceId = newId();
  await (await volunteerAllowance()).insertOne({
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
