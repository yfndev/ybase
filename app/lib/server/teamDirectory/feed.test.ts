import { beforeEach, expect, test } from "vitest";
import { departments, teams, users } from "../../db/collections";
import { newId } from "../../db/ids";
import type { User } from "../../db/types";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { getTeamDirectory } from "./feed";

const organizationId = "org-team-directory";

setupTestDatabase();

beforeEach(async () => {
  await (
    await departments()
  ).insertMany([
    {
      _id: "department-operations",
      _creationTime: 1,
      name: "Operations",
      organizationId,
      isArchived: false,
      createdBy: newId(),
    },
    {
      _id: "department-archived",
      _creationTime: 2,
      name: "Archived",
      organizationId,
      isArchived: true,
      createdBy: newId(),
    },
  ]);
  await (
    await teams()
  ).insertMany([
    {
      _id: "team-people",
      _creationTime: 1,
      name: "People & Culture",
      departmentId: "department-operations",
      organizationId,
      isArchived: false,
      createdBy: newId(),
    },
    {
      _id: "team-hidden",
      _creationTime: 2,
      name: "Hidden",
      departmentId: "department-archived",
      organizationId,
      isArchived: false,
      createdBy: newId(),
    },
    {
      _id: "team-archived",
      _creationTime: 3,
      name: "Archived Team",
      departmentId: "department-operations",
      organizationId,
      isArchived: true,
      createdBy: newId(),
    },
  ]);
});

test("returns active members directly from their ybase profiles", async () => {
  await (
    await users()
  ).insertMany([
    member({
      _id: "member-visible",
      name: "Ada Beispiel",
    }),
    member({
      _id: "member-defaults",
      name: "Default Person",
    }),
    member({
      _id: "member-offboarded",
      name: "Former Person",
      memberStatus: "offboarded",
    }),
    member({
      _id: "member-archived-team",
      name: "Archived Team Person",
      teamId: "team-archived",
    }),
  ]);

  const feed = await getTeamDirectory(organizationId);

  expect(feed.version).toBe("v1");
  expect(feed.revision).toHaveLength(64);
  expect(feed.data.departments).toHaveLength(1);
  expect(feed.data.departments[0]?.teams[0]?.members).toEqual([
    {
      id: `ybase:${organizationId}:member:member-visible`,
      name: "Ada Beispiel",
      role: "People Lead",
    },
    {
      id: `ybase:${organizationId}:member:member-defaults`,
      name: "Default Person",
      role: "People Lead",
    },
  ]);
});

test("omits incomplete profiles and teams without public members", async () => {
  await (
    await users()
  ).insertOne(
    member({
      _id: "member-without-role",
      positionTitle: undefined,
    }),
  );

  const feed = await getTeamDirectory(organizationId);

  expect(feed.data).toEqual({ departments: [] });
});

function member(
  overrides: Partial<User> & {
    _id: string;
  },
) {
  const { _id, ...rest } = overrides;
  return {
    _id,
    _creationTime: 1,
    name: "Test Member",
    organizationId,
    role: "member" as const,
    teamId: "team-people",
    positionTitle: "People Lead",
    memberStatus: "active" as const,
    teamOnboardingStatus: "completed" as const,
    ...rest,
  };
}
