import { expect, test } from "vitest";
import type { Team, User } from "@/lib/db/types";
import { ALL, filterMembers } from "./filterMembers";

function member(overrides: Partial<User>): User {
  return {
    _id: "id",
    _creationTime: 0,
    memberStatus: "active",
    teamOnboardingStatus: "completed",
    ...overrides,
  };
}

function team(id: string, departmentId: string): Team {
  return {
    _id: id,
    _creationTime: 0,
    name: id,
    departmentId,
    organizationId: "org",
    isArchived: false,
    createdBy: "admin",
  };
}

const teamsById = new Map<string, Team>([
  ["team-eng", team("team-eng", "dept-tech")],
  ["team-ops", team("team-ops", "dept-ops")],
]);

const anna = member({
  _id: "anna",
  name: "Anna Admin",
  email: "anna@youngfounders.network",
  memberStatus: "active",
  teamId: "team-eng",
});
const ben = member({
  _id: "ben",
  name: "Ben Beta",
  email: "ben@youngfounders.network",
  memberStatus: "onboarding",
  teamId: "team-ops",
});
const cara = member({
  _id: "cara",
  name: "Cara Care",
  memberStatus: "archived",
});
const everyone = [anna, ben, cara];

const baseFilters = {
  status: "active" as const,
  departmentId: ALL,
  teamId: ALL,
  search: "",
};

test("filters by membership status tab", () => {
  const active = filterMembers(everyone, baseFilters, teamsById);
  expect(active.map((entry) => entry._id)).toEqual(["anna"]);

  const onboarding = filterMembers(
    everyone,
    { ...baseFilters, status: "onboarding" },
    teamsById,
  );
  expect(onboarding.map((entry) => entry._id)).toEqual(["ben"]);

  const currentAndArchived = filterMembers(
    everyone,
    { ...baseFilters, status: ["active", "archived"] },
    teamsById,
  );
  expect(currentAndArchived.map((entry) => entry._id)).toEqual([
    "anna",
    "cara",
  ]);
});

test("filters by department derived from the member's team", () => {
  const result = filterMembers(
    everyone,
    { ...baseFilters, status: "onboarding", departmentId: "dept-ops" },
    teamsById,
  );
  expect(result.map((entry) => entry._id)).toEqual(["ben"]);
});

test("filters board members by either assigned department", () => {
  const boardMember = member({
    _id: "board",
    secondaryTeamId: "team-eng",
    boardMembership: {
      departmentId: "dept-ops",
      isChair: false,
    },
  });
  const byPrimaryDepartment = filterMembers(
    [boardMember],
    { ...baseFilters, departmentId: "dept-ops" },
    teamsById,
  );
  const bySecondaryDepartment = filterMembers(
    [boardMember],
    { ...baseFilters, departmentId: "dept-tech" },
    teamsById,
  );
  expect(byPrimaryDepartment.map((entry) => entry._id)).toEqual(["board"]);
  expect(bySecondaryDepartment.map((entry) => entry._id)).toEqual(["board"]);
});

test("filters by team", () => {
  const result = filterMembers(
    everyone,
    { ...baseFilters, teamId: "team-eng" },
    teamsById,
  );
  expect(result.map((entry) => entry._id)).toEqual(["anna"]);
});

test("filters members by their optional second team and department", () => {
  const chapterMember = member({
    _id: "chapter-member",
    teamId: "team-eng",
    secondaryTeamId: "team-ops",
    isTeamLead: true,
  });
  const byTeam = filterMembers(
    [chapterMember],
    { ...baseFilters, teamId: "team-ops" },
    teamsById,
  );
  const byDepartment = filterMembers(
    [chapterMember],
    { ...baseFilters, departmentId: "dept-ops" },
    teamsById,
  );

  expect(byTeam.map((entry) => entry._id)).toEqual(["chapter-member"]);
  expect(byDepartment.map((entry) => entry._id)).toEqual(["chapter-member"]);
});

test("search matches name and email case-insensitively", () => {
  expect(
    filterMembers(everyone, { ...baseFilters, search: "admin" }, teamsById),
  ).toHaveLength(1);
  expect(
    filterMembers(everyone, { ...baseFilters, search: "ANNA@" }, teamsById),
  ).toHaveLength(1);
  expect(
    filterMembers(everyone, { ...baseFilters, search: "missing" }, teamsById),
  ).toHaveLength(0);
});
