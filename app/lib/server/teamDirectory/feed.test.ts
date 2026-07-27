import { beforeEach, expect, test } from "vitest";
import { departments, teams, users } from "../../db/collections";
import { newId } from "../../db/ids";
import type { User } from "../../db/types";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { getTeamDirectoryV1 } from "./feed";

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
      websiteSortOrder: 20,
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
      websiteSortOrder: 10,
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

test("returns all active members with optional team page settings", async () => {
  await (
    await users()
  ).insertMany([
    member({
      _id: "member-visible",
      name: "Ada Beispiel",
      publicTeamProfile: {
        isTeamLead: true,
        sortOrder: 10,
        board: {
          role: "Operations",
          isChair: true,
          sortOrder: 5,
        },
      },
    }),
    member({
      _id: "member-defaults",
      name: "Default Person",
    }),
    member({
      _id: "member-offboarded",
      name: "Former Person",
      memberStatus: "offboarded",
      publicTeamProfile: {
        isTeamLead: false,
        sortOrder: 1,
      },
    }),
    member({
      _id: "member-archived-team",
      name: "Archived Team Person",
      teamId: "team-archived",
      publicTeamProfile: {
        isTeamLead: false,
        sortOrder: 1,
        board: {
          role: "Operations",
          isChair: false,
          sortOrder: 1,
        },
      },
    }),
  ]);

  const feed = await getTeamDirectoryV1(organizationId);

  expect(feed.version).toBe("v1");
  expect(feed.revision).toHaveLength(64);
  expect(feed.data.departments).toHaveLength(1);
  expect(feed.data.departments[0]?.teams[0]?.members).toEqual([
    {
      id: `ybase:${organizationId}:member:member-visible`,
      name: "Ada Beispiel",
      role: "People Lead",
      isLead: true,
      sortOrder: 10,
    },
    {
      id: `ybase:${organizationId}:member:member-defaults`,
      name: "Default Person",
      role: "People Lead",
      isLead: false,
      sortOrder: 100,
    },
  ]);
  expect(feed.data.board).toEqual([
    {
      id: `ybase:${organizationId}:member:member-visible`,
      name: "Ada Beispiel",
      role: "Operations",
      isChair: true,
      sortOrder: 5,
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
      publicTeamProfile: {
        isTeamLead: false,
        sortOrder: 100,
      },
    }),
  );

  const feed = await getTeamDirectoryV1(organizationId);

  expect(feed.data).toEqual({ board: [], departments: [] });
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
