import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({
  requireUser: vi.fn(),
  requirePermission: vi.fn(),
}));

import { requirePermission, requireUser } from "../../auth/session";
import { departments, organizations, teams } from "../../db/collections";
import { newId } from "../../db/ids";
import { createTestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { archiveTeam, createTeam, unarchiveTeam, updateTeam } from "./actions";
import { getActiveTeams, getArchivedTeams } from "./data";

let orgA: string;
let orgB: string;
let userA: string;
let departmentA: string;

async function insertDepartment(
  organizationId: string,
  isArchived = false,
): Promise<string> {
  const _id = newId();
  await (
    await departments()
  ).insertOne({
    _id,
    _creationTime: Date.now(),
    name: "Dept",
    organizationId,
    isArchived,
    createdBy: userA,
  });
  return _id;
}

setupTestDatabase();

beforeEach(async () => {
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
  const actor = createTestActor({
    _id: userA,
    organizationId: orgA,
    role: "people_culture",
  });
  vi.mocked(requireUser).mockResolvedValue(actor);
  vi.mocked(requirePermission).mockResolvedValue(actor);
  departmentA = await insertDepartment(orgA);
});

test("createTeam links to a department and stays scoped to the org", async () => {
  await createTeam({ name: "Team A1", departmentId: departmentA });
  const foreignDept = await insertDepartment(orgB);
  await (
    await teams()
  ).insertOne({
    _id: newId(),
    _creationTime: Date.now(),
    name: "Team B1",
    departmentId: foreignDept,
    organizationId: orgB,
    isArchived: false,
    createdBy: newId(),
  });

  const list = await getActiveTeams();
  expect(list.map((t) => t.name)).toEqual(["Team A1"]);
  expect(list[0].departmentId).toBe(departmentA);
});

test("createTeam rejects an archived department", async () => {
  const archived = await insertDepartment(orgA, true);
  await expect(
    createTeam({ name: "Team", departmentId: archived }),
  ).rejects.toThrow("Department nicht verfügbar");
});

test("createTeam rejects a department from another org", async () => {
  const foreignDept = await insertDepartment(orgB);
  await expect(
    createTeam({ name: "Team", departmentId: foreignDept }),
  ).rejects.toThrow("Department nicht verfügbar");
});

test("updateTeam changes name and department", async () => {
  const id = await createTeam({ name: "Alt", departmentId: departmentA });
  const otherDept = await insertDepartment(orgA);
  await updateTeam({ teamId: id, name: "Neu", departmentId: otherDept });
  expect((await getActiveTeams())[0]).toMatchObject({
    name: "Neu",
    departmentId: otherDept,
  });
});

test("archive moves a team out of the active list and back", async () => {
  const id = await createTeam({ name: "Team", departmentId: departmentA });
  await archiveTeam({ teamId: id });
  expect(await getActiveTeams()).toHaveLength(0);
  expect((await getArchivedTeams()).map((t) => t.name)).toEqual(["Team"]);
  await unarchiveTeam({ teamId: id });
  expect(await getActiveTeams()).toHaveLength(1);
});

test("team keeps its department reference after the department is archived", async () => {
  await createTeam({ name: "Team", departmentId: departmentA });
  await (
    await departments()
  ).updateOne({ _id: departmentA }, { $set: { isArchived: true } });
  expect((await getActiveTeams())[0].departmentId).toBe(departmentA);
});

test("cannot touch a team from another org", async () => {
  const foreign = newId();
  await (
    await teams()
  ).insertOne({
    _id: foreign,
    _creationTime: Date.now(),
    name: "Fremd",
    departmentId: newId(),
    organizationId: orgB,
    isArchived: false,
    createdBy: newId(),
  });
  await expect(archiveTeam({ teamId: foreign })).rejects.toThrow(
    "Access denied",
  );
});
