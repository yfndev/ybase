import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({
  requireUser: vi.fn(),
  requireRole: vi.fn(),
}));

import { requireRole, requireUser } from "../../auth/session";
import { getClient, getDb } from "../../db/client";
import { organizations, projects, reimbursements } from "../../db/collections";
import { newId } from "../../db/ids";
import {
  archiveProject,
  createProject,
  deleteProject,
  unarchiveProject,
  updateProject,
} from "./actions";
import { getAllProjects, getArchivedProjects } from "./data";

let mongod: MongoMemoryServer;
let orgA: string;
let orgB: string;
let userA: string;

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
    role: "admin" as const,
  };
  vi.mocked(requireUser).mockResolvedValue(actor);
  vi.mocked(requireRole).mockResolvedValue(actor);
});

test("createProject + getAllProjects stay scoped to the caller's org", async () => {
  await createProject({ name: "Projekt A1" });
  expect(requireRole).toHaveBeenCalledWith("admin");
  await (
    await projects()
  ).insertOne({
    _id: newId(),
    _creationTime: Date.now(),
    name: "Projekt B1",
    organizationId: orgB,
    isArchived: false,
    createdBy: newId(),
  });

  const list = await getAllProjects();
  expect(list.map((p) => p.name)).toEqual(["Projekt A1"]);
});

test("updateProject updates the name and travel defaults", async () => {
  const id = await createProject({
    name: "Alt",
    travelDestination: "Köln",
    travelPurpose: "Workshop",
  });
  await updateProject({
    projectId: id,
    name: "Neu",
    travelDestination: "Hamburg",
    travelPurpose: "Team-Wochenende",
  });
  expect(requireRole).toHaveBeenLastCalledWith("admin");
  expect((await getAllProjects())[0]).toMatchObject({
    name: "Neu",
    travelDestination: "Hamburg",
    travelPurpose: "Team-Wochenende",
  });
});

test("archive moves a project out of the active list and back", async () => {
  const id = await createProject({ name: "Projekt" });
  await archiveProject({ projectId: id });
  expect(await getAllProjects()).toHaveLength(0);
  expect((await getArchivedProjects()).map((p) => p.name)).toEqual(["Projekt"]);
  await unarchiveProject({ projectId: id });
  expect(await getAllProjects()).toHaveLength(1);
});

test("deleteProject with merge reassigns reimbursements and removes the project", async () => {
  const source = await createProject({ name: "Quelle" });
  const target = await createProject({ name: "Ziel" });
  await (
    await reimbursements()
  ).insertOne({
    _id: newId(),
    _creationTime: Date.now(),
    organizationId: orgA,
    projectId: source,
    amount: 5,
    type: "expense",
    status: "pending",
    iban: "DE00",
    accountHolder: "x",
    createdBy: userA,
  });

  await deleteProject({ projectId: source, mergeIntoProjectId: target });

  expect((await getAllProjects()).map((p) => p.name)).toEqual(["Ziel"]);
  expect((await (await reimbursements()).findOne({}))?.projectId).toBe(target);
});

test("cannot touch a project from another org", async () => {
  const foreign = newId();
  await (
    await projects()
  ).insertOne({
    _id: foreign,
    _creationTime: Date.now(),
    name: "Fremd",
    organizationId: orgB,
    isArchived: false,
    createdBy: newId(),
  });
  await expect(deleteProject({ projectId: foreign })).rejects.toThrow(
    "Access denied",
  );
});
