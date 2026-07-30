import { beforeEach, expect, test } from "vitest";
import { departments, teams, users } from "../../db/collections";
import { newId } from "../../db/ids";
import type { User } from "../../db/types";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { getTeamDirectory } from "./feed";

const organizationId = "org-team-directory";
const publicOrigin = "https://ybase.example";

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
      _id: "team-chapter",
      _creationTime: 3,
      name: "Chapter Berlin",
      departmentId: "department-operations",
      organizationId,
      isChapter: true,
      isArchived: false,
      createdBy: newId(),
    },
    {
      _id: "team-archived",
      _creationTime: 4,
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
      secondaryTeamId: "team-chapter",
      isTeamLead: true,
      isSecondaryTeamLead: true,
      profileImageStorageKey: "profile-image",
      publicProfileCompletedAt: 100,
    }),
    member({
      _id: "member-board",
      name: "Board Person",
      teamId: undefined,
      boardMembership: {
        departmentId: "department-operations",
        isChair: true,
        secondaryRole: "Finanzen",
      },
      profileImageStorageKey: "board-profile-image",
      publicProfileCompletedAt: 100,
    }),
    member({
      _id: "member-board-without-secondary-role",
      name: "Board Person Without Secondary Role",
      teamId: undefined,
      boardMembership: {
        departmentId: "department-operations",
        isChair: false,
      },
    }),
    member({
      _id: "member-defaults",
      name: "Aaron Default",
    }),
    member({
      _id: "member-planned",
      name: "Planned Person",
      memberStatus: "offboarding_planned",
    }),
    member({
      _id: "member-offboarding",
      name: "Offboarding Person",
      teamId: undefined,
      memberStatus: "offboarding",
      boardMembership: {
        departmentId: "department-operations",
        isChair: false,
      },
    }),
    member({
      _id: "member-archived",
      name: "Archived Person",
      memberStatus: "archived",
    }),
    member({
      _id: "member-archived-team",
      name: "Archived Team Person",
      teamId: "team-archived",
    }),
  ]);

  const feed = await getTeamDirectory(organizationId, publicOrigin);

  expect(feed.version).toBe("v1");
  expect(feed.revision).toHaveLength(64);
  expect(feed.data.board).toEqual([
    {
      id: `ybase:${organizationId}:member:member-board`,
      departmentId: `ybase:${organizationId}:department:department-operations`,
      name: "Board Person",
      role: "Operations",
      isChair: true,
      secondaryRole: "Finanzen",
      imageUrl: `${publicOrigin}/api/v1/team-directory/images/member-board`,
    },
    {
      id: `ybase:${organizationId}:member:member-board-without-secondary-role`,
      departmentId: `ybase:${organizationId}:department:department-operations`,
      name: "Board Person Without Secondary Role",
      role: "Operations",
      isChair: false,
    },
  ]);
  expect(feed.data.departments).toHaveLength(1);
  const directoryTeams = feed.data.departments[0]?.teams ?? [];
  expect(directoryTeams.map((team) => team.name)).toEqual([
    "People & Culture",
    "Chapter Berlin",
  ]);
  const primaryTeam = directoryTeams.find(
    (team) => team.name === "People & Culture",
  );
  const chapterTeam = directoryTeams.find(
    (team) => team.name === "Chapter Berlin",
  );
  expect(primaryTeam?.isChapter).toBe(false);
  expect(chapterTeam?.isChapter).toBe(true);
  expect(primaryTeam?.members).toEqual([
    {
      id: `ybase:${organizationId}:member:member-visible`,
      name: "Ada Beispiel",
      role: "Lead",
      isLead: true,
      imageUrl: `${publicOrigin}/api/v1/team-directory/images/member-visible`,
    },
    {
      id: `ybase:${organizationId}:member:member-defaults`,
      name: "Aaron Default",
      role: "",
      isLead: false,
    },
    {
      id: `ybase:${organizationId}:member:member-planned`,
      name: "Planned Person",
      role: "",
      isLead: false,
    },
  ]);
  expect(chapterTeam?.members).toEqual([
    {
      id: `ybase:${organizationId}:member:member-visible`,
      name: "Ada Beispiel",
      role: "",
      isLead: false,
      imageUrl: `${publicOrigin}/api/v1/team-directory/images/member-visible`,
    },
  ]);
});

test("includes members without a position", async () => {
  await (
    await users()
  ).insertOne(
    member({
      _id: "member-without-position",
      positionTitle: undefined,
    }),
  );

  const feed = await getTeamDirectory(organizationId, publicOrigin);

  expect(feed.data.departments[0]?.teams[0]?.members).toEqual([
    {
      id: `ybase:${organizationId}:member:member-without-position`,
      name: "Test Member",
      role: "",
      isLead: false,
    },
  ]);
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
