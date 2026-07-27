import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({
  requireUser: vi.fn(),
  requirePermission: vi.fn(),
}));

import { requirePermission, requireUser } from "../../auth/session";
import { USER_PERMISSIONS } from "../../auth/roles";
import { departments, organizations } from "../../db/collections";
import { newId } from "../../db/ids";
import { createTestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import {
  archiveDepartment,
  createDepartment,
  unarchiveDepartment,
  updateDepartment,
} from "./actions";
import { getActiveDepartments, getArchivedDepartments } from "./data";

let orgA: string;
let orgB: string;
let userA: string;

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
});

test("createDepartment + getActiveDepartments stay scoped to the caller's org", async () => {
  await createDepartment({ name: "Marketing" });
  expect(requirePermission).toHaveBeenCalledWith(
    USER_PERMISSIONS.organizationStructure,
  );
  await (
    await departments()
  ).insertOne({
    _id: newId(),
    _creationTime: Date.now(),
    name: "Fremd",
    organizationId: orgB,
    isArchived: false,
    createdBy: newId(),
  });

  const list = await getActiveDepartments();
  expect(list.map((d) => d.name)).toEqual(["Marketing"]);
});

test("updateDepartment renames the department", async () => {
  const id = await createDepartment({ name: "Alt" });
  await updateDepartment({ departmentId: id, name: "Neu" });
  expect((await getActiveDepartments())[0]).toMatchObject({ name: "Neu" });
});

test("archive moves a department out of the active list and back", async () => {
  const id = await createDepartment({ name: "IT" });
  await archiveDepartment({ departmentId: id });
  expect(await getActiveDepartments()).toHaveLength(0);
  expect((await getArchivedDepartments()).map((d) => d.name)).toEqual(["IT"]);
  await unarchiveDepartment({ departmentId: id });
  expect(await getActiveDepartments()).toHaveLength(1);
});

test("cannot touch a department from another org", async () => {
  const foreign = newId();
  await (
    await departments()
  ).insertOne({
    _id: foreign,
    _creationTime: Date.now(),
    name: "Fremd",
    organizationId: orgB,
    isArchived: false,
    createdBy: newId(),
  });
  await expect(
    updateDepartment({ departmentId: foreign, name: "Hack" }),
  ).rejects.toThrow("Access denied");
});
